<template>
  <div class="translate box-border w-full h-full py-[20px] sm:p-[20px]">
    <div
      class="title flex items-center border-b-[1px] border-b-solid border-b-[#E0E0E0] sm:border-b-0"
    >
      <div class="origin text-center">中文</div>
      <el-icon><Switch /></el-icon>
      <div class="target text-center">英文</div>
    </div>
    <div class="content w-full sm:flex sm:justify-between sm:gap-[10px]">
      <div class="origin">
        <textarea
          ref="originRef"
          class="text !w-full border-0 sm:border-rounded-[8px] sm:border-[1px] border-solid border-[#E0E0E0]"
          v-model="originText"
          placeholder="在此输入要翻译的文本…"
          @input="handleInput"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
        ></textarea>
      </div>
      <div class="target w-full sm:block">
        <textarea
          ref="targetRef"
          disabled
          v-model="translateText"
          placeholder="译文将显示在这里"
          class="text !w-full bg-[#f5f5f5] border-0 sm:border-rounded-[8px] sm:border-[1px] border-solid border-[#E0E0E0]"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from "vue";
import { Switch } from "@element-plus/icons-vue";
import { debounce } from "lodash-es";

const originRef = ref(null);
const targetRef = ref(null);
const isComposing = ref(false);
const controllerRef = ref(null);
const originText = ref('标签内容格式器，支持字符串模板和回调函数两种形式，字符串模板与回调函数返回的字符串均支持用 \n 换行。');
const translateText = ref('The tag content formatter supports two forms: string template and callback function. Both the string template and the string returned by the callback function support \\n for newline.');

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
    const resp = await fetch(`http://localhost:3000/translate?text=${encodeURIComponent(text)}&target=en`, {
      signal: controllerRef.value.signal,
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    console.log('resp', data);
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

const autoResize = (el) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

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

onMounted(() => {
  nextTick(() => {
    autoResize(originRef.value);
    autoResize(targetRef.value);
  });
});

onUnmounted(() => {
  if (controllerRef.value) controllerRef.value.abort();
  if (debouncedTranslate?.cancel) debouncedTranslate.cancel();
});
</script>

<style lang="scss" scoped>
.origin,
.target {
  flex: 1 0 0;
  .text {
    font-size: 24px;
    min-height: 220px;
    padding: 12px 14px;
    line-height: 1.6;
    border-radius: 10px;
    border-color: #e0e0e0;
    background-color: #fff;
    outline: none;
    overflow: hidden; // 隐藏滚动条，配合自动高度
    resize: none; // 禁用手动拖拽以避免与自动高度冲突
    box-sizing: border-box; // 使高度计算包含内边距
    transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease;
    // 字体：正文用全局字体栈即可，代码片断仍会被全局 .message 规则覆盖
    &::placeholder {
      color: #9e9e9e;
    }
    &:focus {
      border-color: #409eff; // Element Plus 主色
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
      background-color: #fff;
    }
    &:disabled {
      color: #616161;
      background-color: #f7f8fa;
      border-color: #e5e7eb;
      box-shadow: none;
    }
  }
}
</style>
