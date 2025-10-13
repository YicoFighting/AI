<!-- 或者使用华为的开源组件：https://matechat.gitcode.com/ -->
<template>
  <el-button type="primary" @click="handleClick">Click me</el-button>
  <div class="message" v-html="html"></div>
</template>

<script setup>
import { ref } from "vue";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import DOMPurify from "dompurify";
import MarkdownIt from 'markdown-it';
import { full as emoji } from 'markdown-it-emoji'

const message = ref("");
const html = ref("");

const md = new MarkdownIt({
  html: true,
  xhtmlOut: false,
  breaks: false,
  langPrefix: "language-",
  linkify: true,
  typographer: false,
  quotes: "\"\"''",
  highlight: function (code, lang) {
    console.log("🎯 代码块被识别:", {
      lang,
      hasLanguage: lang && hljs.getLanguage(lang),
      codePreview: code.substring(0, 50) + (code.length > 50 ? "..." : ""),
    });
    let className = "hljs";
    try {
      if (lang && hljs.getLanguage(lang)) {
        const out = hljs.highlight(code, {
          language: lang,
          ignoreIllegals: true,
        }).value;
        className += ` language-${lang}`;
        return `<pre><code class="${className}">${out}</code></pre>`;
      }
      const auto = hljs.highlightAuto(code);
      if (auto.language) className += ` language-${auto.language}`;
      return `<pre><code class="${className}">${auto.value}</code></pre>`;
    } catch {
      const escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<pre><code class="${className}">${escaped}</code></pre>`;
    }
  },
});
// emoji 扩展
md.use(emoji);

const handleClick = async () => {
  const resp = await fetch("http://localhost:3000/sse", {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: "Hello, world!" }),
  });

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";

    for (const frame of frames) {
      const dataLines = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("data: ")) {
          dataLines.push(line.slice(6));
        }
      }
      const payload = dataLines.join("\n");
      if (payload === "[DONE]") {
        console.log("end");
      } else if (payload === "[START]") {
        console.log("start");
      } else {
        console.log("chunk:", payload);
        message.value += payload;
        const raw = md.render(message.value);
        html.value = DOMPurify.sanitize(raw);
      }
    }
  }
};
</script>

<style scoped>
.message {
  line-height: 1.7;
}

/* v-html 渲染的子节点需要用深度选择器 */
.message :deep(pre) {
  background-color: #f6f8fa; /* GitHub-like */
  border: 1px solid #eaeef2;
  border-radius: 8px;
  padding: 12px 16px;
  overflow: auto;
  margin: 12px 0;
  line-height: 1.6;
  position: relative;
}

.message :deep(pre code) {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  tab-size: 2;
}

.message :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

/* 让行内代码更清晰 */
.message :deep(p > code),
.message :deep(li > code) {
  background-color: #f6f8fa;
  border: 1px solid #eaeef2;
  border-radius: 4px;
  padding: 0 4px;
  margin: 0 2px;
}

/* 标题间距微调 */
.message :deep(h1),
.message :deep(h2),
.message :deep(h3),
.message :deep(h4),
.message :deep(h5),
.message :deep(h6) {
  margin: 16px 0 8px;
}
</style>
