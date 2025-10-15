# AI

AI 流式回答

- 可参考开源项目

  `chatgpt-web`：https://github.com/Chanzhaoyu/chatgpt-web/tree/main

  `matechat(对话,气泡框包含 md 文件解析)`：https://matechat.gitcode.com/

# 字体

下面按你列的字体逐一给出“下载/获取方式”和“CDN/在线引入”情况（能在线的就给可用链接，不能在线的说明原因与替代方案）。

- Noto Sans SC（思源黑体简体）

  - 下载/预览: [Google Fonts · Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC)
  - CDN（Google Fonts）:
    ```html
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    ```
  - 中国大陆镜像（可尝试）:
    ```html
    <link
      href="https://fonts.googleapis.cn/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    ```
  - 本地打包（不依赖外网）:
    - pnpm: `pnpm add @fontsource/noto-sans-sc`
    - 使用: `import "@fontsource/noto-sans-sc/400.css"; import "@fontsource/noto-sans-sc/700.css";`

- Noto Sans

  - 下载/预览: [Google Fonts · Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans)
  - CDN:
    ```html
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    ```
  - 本地打包: `pnpm add @fontsource/noto-sans`

- Liberation Sans

  - 下载（官方发布）: [GitHub · liberation-fonts/releases](https://github.com/liberationfonts/liberation-fonts/releases)
  - CDN: 无官方稳定 CDN，建议自托管到 `public/fonts/` 并用 `@font-face` 引入，或改用 Noto/Roboto 等有 CDN 的替代

- PingFang SC（苹方）

  - 获取: macOS/iOS 系统自带，未提供官方独立下载或 Web CDN 分发
  - 说明: 作为系统字体回退使用，无需（且不应）打包到 Web

- Hiragino Sans GB（冬青黑体）

  - 获取: 商业字体（DynaComware），需购买授权；无官方免费 CDN
  - 说明: Web 不建议直接嵌入，推荐用 Noto Sans SC/Source Han Sans SC 替代

- Microsoft YaHei（微软雅黑）

  - 获取: Windows 系统自带（随系统/Office 分发），无官方 Web CDN
  - 说明: 作为系统回退字体使用

- Helvetica Neue

  - 获取: 商业字体（Monotype），无免费官方 CDN
  - 说明: 用作系统回退；Web 建议使用开源替代（如 Inter、Roboto）

- Arial
  - 获取: Windows/macOS 常见系统字体，无官方 Web CDN
  - 说明: 系统回退即可

补充：代码等宽字体（你已在用的可跨平台一致）

- JetBrains Mono: `https://www.jetbrains.com/lp/mono/`
  - Google Fonts（CDN）:
    ```html
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    ```
- Fira Code: `https://github.com/tonsky/FiraCode/releases`
  - Google Fonts（CDN）:
    ```html
    <link
      href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    ```
- Cascadia Code: `https://github.com/microsoft/cascadia-code/releases`
  - jsDelivr（@fontsource）:
    ```html
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@fontsource/cascadia-code@latest/index.css"
    />
    ```

快速使用示例

- 在 `index.html` 里引入（任选其一或组合）:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap"
  rel="stylesheet"
/>
<link
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
  rel="stylesheet"
/>
<link
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
  rel="stylesheet"
/>
```

- 在 CSS 中设置：

```css
body {
  font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans",
    system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.message :deep(pre code),
.message :deep(code) {
  font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace,
    SFMono-Regular, Menlo, Consolas, "Liberation Mono", "Courier New", Monaco,
    monospace;
}
```

建议

- 为稳定加载，正文用 Noto Sans SC（或本地 @fontsource），代码用 JetBrains Mono/Fira Code 其一；其余字体保持为系统回退。

# Rem 适配
