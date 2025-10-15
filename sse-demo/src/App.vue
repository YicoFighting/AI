<template>
  <McLayout class="container">
    <!-- 对话左上角 -->
    <McHeader :title="'AI'" :logoImg="'https://matechat.gitcode.com/logo.svg'">
    </McHeader>
    <!-- 未输入时 -->
    <McLayoutContent
      v-if="startPage"
      class="flex flex-col items-center justify-center gap-[12px]"
    >
      <McIntroduction
        :logoImg="'https://matechat.gitcode.com/logo2x.svg'"
        :title="'AI'"
        :subTitle="'欢迎使用'"
      ></McIntroduction>
    </McLayoutContent>
    <!-- 对话 -->
    <McLayoutContent class="content-container" v-else>
      <template v-for="(msg, idx) in messages" :key="idx">
        <McBubble
          v-if="msg.from === 'user'"
          :content="msg.content"
          :align="'right'"
          :avatarConfig="{
            imgSrc: 'https://matechat.gitcode.com/png/demo/userAvatar.svg',
          }"
        >
        </McBubble>
        <McBubble
          v-else
          :avatarConfig="{ imgSrc: 'https://matechat.gitcode.com/logo.svg' }"
          :loading="msg.loading"
        >
          <McMarkdownCard :content="msg.content"></McMarkdownCard>
        </McBubble>
      </template>
    </McLayoutContent>
    <McLayoutSender>
      <McInput
        :value="inputValue"
        :maxLength="2000"
        @change="(e) => (inputValue = e)"
        @submit="onSubmit"
      >
        <template #extra>
          <div class="input-foot-wrapper">
            <div class="input-foot-left">
              <span class="input-foot-maxlength">
                {{ inputValue.length }}/2000
              </span>
            </div>
            <div class="input-foot-right">
              <Button
                shape="round"
                :disabled="!inputValue"
                @click="inputValue = ''"
              >
                <span class="demo-button-content">清空输入</span>
              </Button>
            </div>
          </div>
        </template>
      </McInput>
    </McLayoutSender>
  </McLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Button } from "vue-devui/button";
import "vue-devui/button/style.css";

const startPage = ref(true);
const inputValue = ref("");

const messages = ref<any[]>([]);

const newConversation = () => {
  startPage.value = true;
  messages.value = [];
};

const fetchData = async (ques) => {
  messages.value.push({
    from: "model",
    content: "",
    avatarConfig: { name: "model" },
    id: "",
    loading: true,
  });

  const resp = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: ques,
    }),
  });

  const reader = resp?.body?.getReader() || null;
  const decoder = new TextDecoder();

  const chatId = Date.now();
  while (true) {
    const { done, value } = (await reader?.read()) || {
      done: false,
      value: null,
    };
    if (done) break;
    const text = decoder.decode(value as Uint8Array, { stream: true });
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
      messages.value[messages.value.length - 1].loading = false;
      messages.value[messages.value.length - 1].content += payload;
      messages.value[messages.value.length - 1].id = chatId;
      // message.value += payload;
      // const raw = md.render(message.value);
      // html.value = DOMPurify.sanitize(raw);
    }
  }

  // const completion = await client.chat.completions.create({
  //   model: 'my-model', // 替换为自己的model名称
  //   messages: [{ role: 'user', content: ques }],
  //   stream: true, // 为 true 则开启接口的流式返回
  // });
  // for await (const chunk of completion) {
  //   messages.value[messages.value.length - 1].loading = false;
  //   const content = chunk.choices[0]?.delta?.content || '';
  //   const chatId = chunk.id;
  //   messages.value[messages.value.length - 1].content += content;
  //   messages.value[messages.value.length - 1].id = chatId;
  // }
};

const onSubmit = (evt) => {
  inputValue.value = "";
  startPage.value = false;
  // 用户发送消息
  messages.value.push({
    from: "user",
    content: evt,
    avatarConfig: { name: "user" },
  });

  fetchData(evt);
};
</script>

<style lang="scss" scoped>
.container {
  width: 1000px;
  margin: 20px auto;
  height: calc(100vh - 82px);
  padding: 20px;
  gap: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 16px;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.input-foot-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  margin-right: 8px;

  .input-foot-left {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      font-size: 14px;
      line-height: 18px;
      color: #252b3a;
      cursor: pointer;
    }

    .input-foot-dividing-line {
      width: 1px;
      height: 14px;
      background-color: #d7d8da;
    }

    .input-foot-maxlength {
      font-size: 14px;
      color: #71757f;
    }
  }

  .input-foot-right {
    .demo-button-content {
      font-size: 14px;
    }

    & > *:not(:first-child) {
      margin-left: 8px;
    }
  }
}
</style>
