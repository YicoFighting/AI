import express, { Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import fs from "fs";
import path from "path";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { GoogleGenAI } from "@google/genai";
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
  setGlobalDispatcher(
    new ProxyAgent(process.env.HTTPS_PROXY || process.env.HTTP_PROXY!)
  );
}

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

app.post("/sse", async (req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(`data: [START]\n\n`);

  try {
    const filePath = path.resolve(__dirname, "example.md");
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

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`SSE listening on http://localhost:${port}`);
});
