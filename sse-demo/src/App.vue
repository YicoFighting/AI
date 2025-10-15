<!-- 或者使用华为的开源组件：https://matechat.gitcode.com/ -->
<template>
  <div class="home">
    <el-button class="btn" type="primary" @click="handleClick">
      Click me
    </el-button>
    <div class="message" v-html="html"></div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import { full as emoji } from "markdown-it-emoji";

const message = ref("");
const html = ref("");

// https://markdown-it.github.io/
const md = new MarkdownIt({
  html: true,
  xhtmlOut: false,
  breaks: false,
  langPrefix: "language-",
  linkify: true,
  typographer: false,
  // quotes: "\"\"''",
  highlight: function (code, lang) {
    // console.log("🎯 代码块被识别:", {
    //   lang,
    //   hasLanguage: lang && hljs.getLanguage(lang),
    //   codePreview: code.substring(0, 50) + (code.length > 50 ? "..." : ""),
    // });
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
  const resp = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "你可以给我写个冒泡排序吗？使用 JavaScript",
    }),
  });

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      let payload = line.slice(6).replace(/\r$/, "");
      if (payload === "[DONE]") continue;
      // 去除整段包裹的前后引号（仅当首尾同时为同类引号时）
      const first = payload[0];
      const last = payload[payload.length - 1];
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        payload = payload.slice(1, -1);
      }
      // 这个转义很重要
      payload = payload
        .replace(/\\\\/g, "\\")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");
      message.value += payload;
      const raw = md.render(message.value);
      html.value = DOMPurify.sanitize(raw);
    }
  }
};
</script>

<style scoped>
.home {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}
.btn {
  width: 120px;
  margin-bottom: 10px;
}
.message {
  flex: 1 0 0;
  overflow-x: hidden;
  overflow-y: auto;
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
/* 
* ui-monospace：系统通用别名
* SFMono-Regular：macOS 系统字体
* Menlo：macOS 系统字体
* Consolas：Windows 系统字体
* "Liberation Mono"：Linux 系统字体
* "Courier New"：Windows 系统字体
* Monaco：macOS 系统字体
* monospace：通用字体族
*/
.message :deep(pre code) {
  display: block;
  font-size: 13px;
  tab-size: 2;
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

/* 段落与文字 */
.message :deep(p) {
  margin: 0.8em 0;
  color: #24292f;
}

/* 链接样式 */
.message :deep(a) {
  color: #0969da;
  text-decoration: none;
  border-bottom: 1px solid rgba(9, 105, 218, 0.25);
}
.message :deep(a:hover) {
  text-decoration: underline;
  border-bottom-color: transparent;
}

/* 引用块 */
.message :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 12px;
  border-left: 4px solid #d0d7de;
  background-color: #f6f8fa;
  color: #57606a;
}

/* 列表 */
.message :deep(ul),
.message :deep(ol) {
  margin: 8px 0;
  padding-left: 1.5em;
}
.message :deep(li) {
  margin: 6px 0;
}

/* 分割线 */
.message :deep(hr) {
  border: 0;
  border-top: 1px solid #d0d7de;
  margin: 24px 0;
}

/* 表格 */
.message :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  display: block;
  overflow: auto;
}
.message :deep(th),
.message :deep(td) {
  border: 1px solid #d0d7de;
  padding: 8px 12px;
  text-align: left;
}
.message :deep(thead th) {
  background: #f3f4f6;
}
.message :deep(tbody tr:nth-child(odd)) {
  background: #f9fafb;
}

/* 图片 */
.message :deep(img) {
  max-width: 100%;
  display: block;
  border-radius: 6px;
  margin: 8px 0;
}

/* 标题尺寸微调（相对当前容器） */
.message :deep(h1) {
  font-size: 1.6em;
}
.message :deep(h2) {
  font-size: 1.4em;
}
.message :deep(h3) {
  font-size: 1.25em;
}
.message :deep(h4) {
  font-size: 1.1em;
}
.message :deep(h5),
.message :deep(h6) {
  font-size: 1em;
}
</style>
