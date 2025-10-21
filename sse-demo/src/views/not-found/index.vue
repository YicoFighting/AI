<template>
  <div class="not-found flex flex-col justify-center items-center">
    <h1 class="text-[100px] font-bold">404</h1>
    <h4 class="text-[20px] mb-[20px]">页面不存在</h4>
    <el-button type="primary" @click="goHome">返回首页</el-button>
  </div>
 
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/');
};
</script>

<style lang="scss" scoped>
.not-found {
  width: 100%;
  height: 100%;
}
</style>