<template>
  <McLayout class="container">
    <!-- 对话左上角 -->
    <!-- <McHeader :title="'AI'" :logoImg="AiImage">
    </McHeader> -->
    <!-- 未输入时 -->
    <!-- <McLayoutContent
      v-if="startPage"
      class="flex flex-col items-center justify-center gap-[12px]"
    >
      <McIntroduction
        :logoImg="AiImage"
        :title="'AI'"
        :subTitle="'欢迎使用'"
      ></McIntroduction>
    </McLayoutContent> -->
    <!-- 对话 -->
    <!-- <McLayoutContent ref="contentContainerRef" class="content-container" v-else> -->
    <McLayoutContent ref="contentContainerRef" class="content-container">
      <template v-for="(msg, idx) in messages" :key="idx">
        <McBubble
          v-if="msg.from === 'user'"
          :content="msg.content"
          :align="'right'"
          :avatarConfig="{
            imgSrc: UserImage,
          }"
        >
        </McBubble>
        <McBubble
          v-else
          :avatarConfig="{ imgSrc: AiImage }"
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
        placeholder="请输入您的问题"
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
                icon="op-clearup"
                shape="round"
                :disabled="!inputValue"
                @click="inputValue = ''"
              >
                <span class="demo-button-content">清空输入</span>
              </Button>
            </div>
          </div>
        </template>
        <!-- <template #button>
          <Button shape="round" class="send-button bg-['#5e7ce0'] color-['#ffffff']" :disabled="!inputValue || loading" @click="onSubmit">
            发送
          </Button>
        </template> -->
      </McInput>
    </McLayoutSender>
  </McLayout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { Button } from "vue-devui/button";
import "vue-devui/button/style.css";
import AiImage from "@/assets/gemini.png";
import UserImage from "@/assets/deepseek.png";

const startPage = ref(true);
const inputValue = ref("");
const loading = ref(false);

const messages = ref([
  {
    from: "model",
    content: "请输入您的问题",
    avatarConfig: { name: "model" },
    id: "-1",
    loading: false,
  },
]);

// 自动滚动相关
const contentContainerRef = ref < any > null;
const autoScroll = ref(true);

const getContainerEl = () => {
  const comp = contentContainerRef.value;
  if (!comp) return null;
  return comp.$el ? comp.$el : comp;
};

const scrollToBottom = async () => {
  const el = getContainerEl();
  if (!el) return;
  await nextTick();
  el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
};

const onWheel = () => {
  autoScroll.value = false;
};

const fetchData = async (ques) => {
  messages.value.push({
    from: "model",
    content: "",
    avatarConfig: { name: "model" },
    id: "",
    loading: true,
  });
  if (autoScroll.value) scrollToBottom();
  loading.value = true;

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
    if (done) {
      loading.value = false;
      break;
    }
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
      messages.value[messages.value.length - 1].loading = false;
      messages.value[messages.value.length - 1].content += payload;
      messages.value[messages.value.length - 1].id = chatId;
      if (autoScroll.value) scrollToBottom();
    }
  }
};

const onSubmit = (evt) => {
  inputValue.value = "";
  startPage.value = false;
  // 再次提问时重新开启自动滚动
  autoScroll.value = true;
  // 用户发送消息
  messages.value.push({
    from: "user",
    content: evt,
    avatarConfig: { name: "user" },
  });

  fetchData(evt);
};

onMounted(() => {
  document.addEventListener("wheel", onWheel);
});

onBeforeUnmount(() => {
  document.removeEventListener("wheel", onWheel);
});
</script>

<style lang="scss" scoped>
.container {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 20px;
  gap: 8px;
}

.content-container {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  :deep(.mc-bubble) {
    width: 100%;
    .mc-bubble-content-container {
      max-width: calc(100% - 40px);
    }
  }
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

.send-button {
  background-color: #5e7ce0;
  color: #ffffff;
  &:disabled {
    background-color: #beccfa;
    cursor: not-allowed;
  }
}

:deep(.mc-bubble-avatar) {
  height: 48px;
  .mc-bubble-avatar-wrapper {
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    img {
      width: 30px !important;
      height: 30px !important;
    }
  }
}
</style>
