import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import os from "os";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { exec } from "child_process";
import axios from "axios";
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
  setGlobalDispatcher(
    new ProxyAgent(process.env.HTTPS_PROXY || process.env.HTTP_PROXY!)
  );
}

const app = express();
app.use(cors());
app.use(express.json());

// Resolve base directory for both dev and pkg runtime
const baseDir = (process as any).pkg
  ? path.dirname(process.execPath)
  : __dirname;

// Load env from baseDir so exe reads .env next to itself
dotenv.config({ path: path.join(baseDir, ".env") });

// Static hosting of frontend build outputs
const publicDir = path.join(baseDir, "public");
app.use(express.static(publicDir));

// Simple file logger to capture errors when double-clicking exe
const logFile = path.join(baseDir, "server.log");
const log = (message: string) => {
  const line = `${new Date().toISOString()} ${message}`;
  console.log(line);
  try {
    fs.appendFileSync(logFile, line + "\n");
  } catch {}
};

app.post("/sse", async (req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(`data: [START]\n\n`);

  try {
    const filePath = path.resolve(baseDir, "example.md");
    await fs.promises.access(filePath, fs.constants.R_OK);
    const content = await fs.promises.readFile(filePath, "utf-8");

    let index = 0;
    let timer: NodeJS.Timeout | null = null;

    const sendChunk = () => {
      if (index >= content.length) {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        res.write("event: end\n");
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      const step = 2 + Math.floor(Math.random() * 4); // 2-5 个字符
      const slice = content.slice(index, index + step);
      index += step;
      // 保留换行：按行写入多条 data 行，SSE 将以换行拼接
      const parts = slice.split(/\r?\n/);
      for (const part of parts) {
        res.write(`data: ${part}\n`);
      }
      res.write(`\n`);
    };

    timer = setInterval(sendChunk, 100);

    req.on("close", () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });
  } catch (err) {
    res.write("event: error\n");
    res.write(
      `data: ${JSON.stringify({
        message: "read error",
        error: String(err),
      })}\n\n`
    );
    res.end();
  }
});

app.post("/chat", async (req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const promote = " 请用中文回答!";
  const contents = String(req.body?.message ?? "") + promote;
  // res.write("data: [START]\n\n");

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      res.write("event: error\n");
      res.write(
        `data: ${JSON.stringify({ message: "missing GOOGLE_API_KEY" })}\n\n`
      );
      return res.end();
    }
    // Lazy import to avoid ESM require issues under pkg
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
    });
    for await (const chunk of response) {
      res.write(`data: ${JSON.stringify(chunk.text)}`);
    }
    // res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    res.write("event: error\n");
    res.write(
      `data: ${JSON.stringify({
        message: "chat error",
        error: String(err),
      })}\n\n`
    );
    res.end();
  }
});

app.get("/translate", async (req: Request, res: Response) => {
  try {
    const text = String(req.query.text ?? "").trim();
    const origin = String(req.query.origin ?? "").trim() || "auto";
    const target = String(req.query.target ?? "").trim() || "en";
    if (!text) {
      return res.status(400).json({ message: "missing text" });
    }

    const url = "https://translate.googleapis.com/translate_a/single";
    const response = await axios.get(url, {
      params: {
        client: "gtx",
        dt: "t",
        sl: origin,
        tl: target,
        q: text,
      },
      timeout: 10000,
    });
    const data = response.data;
    const translated = Array.isArray(data?.[0])
      ? data[0]
          .filter((seg: any) => Array.isArray(seg) && typeof seg[0] === "string")
          .map((seg: any) => seg[0])
          .join("")
      : "";

    if (!translated) {
      return res.status(502).json({ message: "unexpected translate response" });
    }
    console.log('translated =>> ',translated);
    
    return res.json({ text: translated, target });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    return res.status(status).json({ message: "translate error", error: String(err) });
  }
});

// SPA fallback for frontend routing (only for GET requests and non-API paths)
app.get("*", (req, res, next) => {
  if (req.method !== "GET") return next();
  if (
    req.path.startsWith("/sse") ||
    req.path.startsWith("/chat") ||
    req.path.startsWith("/api") ||
    req.path.startsWith("/translate")
  ) {
    return next();
  }
  const indexHtml = path.join(publicDir, "index.html");
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  next();
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => {
  log(`SSE listening on http://localhost:${port}`);
  const networks = os.networkInterfaces();
  const ipv4List = Object.values(networks).flatMap((ifaces) =>
    (ifaces ?? [])
      .filter((iface) => iface.family === "IPv4" && !iface.internal)
      .map((iface) => iface.address)
  );
  if (ipv4List.length > 0) {
    for (const ip of ipv4List) {
      log(`SSE listening on http://${ip}:${port}`);
    }
  }
  if (process.platform === "win32") {
    // exec(`start "" "http://localhost:${port}"`);
  }
});

process.on("unhandledRejection", (err) => {
  log("UnhandledRejection: " + String(err));
});
process.on("uncaughtException", (err) => {
  log("UncaughtException: " + String(err));
});
