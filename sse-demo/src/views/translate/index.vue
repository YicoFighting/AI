<template>
  <div class="translate box-border w-full h-full py-[20px] sm:p-[20px]">
    <div
      class="title flex items-center border-b-[1px] border-b-solid border-b-[#E0E0E0] sm:border-b-0"
    >
      <el-select v-model="originLang" @change="debouncedTranslate(originText)">
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-icon><Switch /></el-icon>
      <el-select
        v-model="targetLang"
        @change="debouncedTranslate(translateText)"
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <div class="content w-full sm:flex sm:justify-between sm:gap-[10px]">
      <div
        class="origin border-0 sm:border-rounded-[8px] sm:border-[1px] border-solid border-[#E0E0E0]"
      >
        <div class="content flex justify-between">
          <textarea
            ref="originRef"
            class="text !w-full border-0"
            v-model="originText"
            placeholder="在此输入要翻译的文本…"
            @input="handleInput"
            @compositionstart="handleCompositionStart"
            @compositionend="handleCompositionEnd"
          ></textarea>
          <!-- <el-icon
            v-if="originText"
            @click="clearOriginText"
            class="m-2 p-2 border-[1px] border-solid border-[transparent] hover:border-[#E0E0E0] rounded-[50%] hover:cursor-pointer"
          >
            <Close />
          </el-icon> -->
        </div>
        <div class="tool-bar flex justify-between p-[10px]">
          <div class="flex items-center gap-[10px]">
            <!-- <el-icon
              :size="20"
              class="cursor-pointer"
              @click="toggleRecognition"
            >
              <Microphone />
            </el-icon>
            <img :src="sound" class="block w-[20px] h-[20px]" /> -->
          </div>
          <el-icon :size="20" class="cursor-pointer" @click="copy(originText)">
            <CopyDocument />
          </el-icon>
        </div>
        <div class="p-[12px] text-[14px] text-[#5f6368]">
          {{ pinyin(originText) }}
        </div>
      </div>
      <div
        class="target w-full sm:block bg-[#f5f5f5] border-0 sm:border-rounded-[8px] sm:border-[1px] border-solid border-[#E0E0E0]"
      >
        <div class="content">
          <textarea
            ref="targetRef"
            disabled
            v-model="translateText"
            placeholder="译文将显示在这里"
            class="text !w-full border-0"
          ></textarea>
        </div>
        <div class="tool-bar flex justify-end p-[10px]">
          <!-- <img :src="sound" class="block w-[20px] h-[20px]" /> -->
          <el-icon
            :size="20"
            class="cursor-pointer"
            @click="copy(translateText)"
          >
            <CopyDocument />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, watch } from "vue";
import { debounce } from "lodash-es";
import { languageOptions } from "./config";
import {
  Close,
  CopyDocument,
  Switch,
  Microphone,
} from "@element-plus/icons-vue";
import sound from "@/assets/sound.png";
import { pinyin } from "pinyin-pro";

const originRef = ref(null);
const targetRef = ref(null);
const isComposing = ref(false);
const controllerRef = ref(null);
const originText = ref("你好，世界!");
const translateText = ref('Hello World!');

const options = languageOptions.map((lang) => ({
  label: lang[1],
  value: lang[0],
}));
const originLang = ref("auto");
const targetLang = ref("en");

// Speech recognition state
const isListening = ref(false);
const recognitionRef = ref(null);

const doTranslate = async (text) => {
  if (!text) {
    if (targetRef.value) {
      translateText.value = "";
      autoResize(targetRef.value);
    }
    return;
  }
  if (controllerRef.value) controllerRef.value.abort();
  controllerRef.value = new AbortController();
  try {
    const resp = await fetch(
      `http://localhost:3000/translate?text=${encodeURIComponent(
        text
      )}&origin=${originLang.value}&target=${targetLang.value}`,
      {
        signal: controllerRef.value.signal,
      }
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const translated = typeof data === "string" ? data : data?.text ?? "";
    if (targetRef.value) {
      translateText.value = translated;
      autoResize(targetRef.value);
    }
  } catch (err) {
    if (err?.name === "AbortError") return; // 新请求已发起，忽略旧请求
    // 静默失败或按需提示
  }
};

const debouncedTranslate = debounce(doTranslate, 450);

const copy = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    ElMessage.success({
      message: "复制成功",
      duration: 1000,
    });
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    ElMessage.success({
      message: "复制成功",
      duration: 1000,
    });
  }
};

// 只能通过 scrollHeight 来计算高度
const autoResize = async (el) => {
  if (!el) return;
  await nextTick();
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

// Web Speech API (SpeechRecognition)
const supportsSpeech =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

const mapLangToBCP47 = (lang) => {
  if (!lang || lang === "auto") return "zh-CN"; // 默认中文，可按需调整
  const mapping = {
    en: "en-US",
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    ja: "ja-JP",
    ko: "ko-KR",
    yue: "yue-Hant-HK",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
  };
  return mapping[lang] || lang;
};

const initSpeechRecognition = () => {
  if (!supportsSpeech) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = mapLangToBCP47(originLang.value);

  recognition.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const piece = event.results[i][0]?.transcript || "";
      if (event.results[i].isFinal) finalTranscript += piece;
      else interimTranscript += piece;
    }
    if (finalTranscript) {
      originText.value =
        (originText.value ? originText.value + " " : "") +
        finalTranscript.trim();
      if (originRef.value) autoResize(originRef.value);
      debouncedTranslate(originText.value);
    }
    // 如需显示临时文本，可在此处合并到 UI（当前忽略）
  };

  recognition.onend = () => {
    isListening.value = false;
  };
  recognition.onerror = () => {
    isListening.value = false;
  };

  recognitionRef.value = recognition;
};

const startRecognition = () => {
  if (!supportsSpeech) {
    ElMessage?.warning?.("当前浏览器不支持语音识别");
    return;
  }
  if (!recognitionRef.value) initSpeechRecognition();
  try {
    recognitionRef.value?.start();
    isListening.value = true;
  } catch (e) {
    // already started
  }
};

const stopRecognition = () => {
  try {
    recognitionRef.value?.stop();
  } finally {
    isListening.value = false;
  }
};

const toggleRecognition = () => {
  if (isListening.value) stopRecognition();
  else startRecognition();
};

watch(originLang, (newVal) => {
  if (recognitionRef.value) {
    recognitionRef.value.lang = mapLangToBCP47(newVal);
  }
});

const handleInput = (e) => {
  if (e.isComposing || isComposing.value) return;
  autoResize(e.target);
  debouncedTranslate(e.target.value);
};

const handleCompositionStart = () => {
  isComposing.value = true;
};

const handleCompositionEnd = (e) => {
  isComposing.value = false;
  // 合成结束后补一次，以捕获最终字符
  autoResize(e.target);
  debouncedTranslate(e.target.value);
};

const autoElementSize = () => {
  nextTick(() => {
    autoResize(originRef.value);
    autoResize(targetRef.value);
  });
};

// const clearOriginText = () => {
//   originText.value = "";
//   translateText.value = "";
//   autoElementSize();
// };

onMounted(() => {
  nextTick(() => {
    autoElementSize();
  });

  // 监听 size 变化
  document.addEventListener("resize", autoElementSize);

  // 初始化语音识别
  initSpeechRecognition();
});

onUnmounted(() => {
  if (controllerRef.value) controllerRef.value.abort();
  if (debouncedTranslate?.cancel) debouncedTranslate.cancel();
  if (isListening.value) {
    try {
      recognitionRef.value?.stop();
    } catch (e) {}
  }
  recognitionRef.value = null;

  document.removeEventListener("resize", autoElementSize);
});
</script>

<style lang="scss" scoped>
.title {
  :deep(.el-select__wrapper) {
    box-shadow: unset;
    .el-select__selection {
      text-align: center;
    }
    .el-select__suffix {
      display: none;
    }
  }
}

.origin,
.target {
  flex: 1 0 0;
  .text {
    // 字体最小为 14px 最大为 16px 能不能让它跟随屏幕变化
    font-size: clamp(14px, 1.2vw + 12px, 16px);
    min-height: 220px;
    padding: 12px 0 12px 12px;
    line-height: 1.6;
    border-radius: 10px;
    border-color: #e0e0e0;
    outline: none;
    overflow: hidden; // 隐藏滚动条，配合自动高度
    resize: none; // 禁用手动拖拽以避免与自动高度冲突
    box-sizing: border-box; // 使高度计算包含内边距
  }
}

.origin {
  .text {
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
      "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", system-ui,
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  }
}

.target {
  .text {
    font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB",
      "Microsoft YaHei", "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans",
      system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif !important;
  }
}
</style>
