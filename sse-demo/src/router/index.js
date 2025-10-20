import { createWebHistory, createRouter } from "vue-router";

import IndexView from "@/views/index/index.vue";
import AiView from "@/views/ai/index.vue";
import TranslateView from "@/views/translate/index.vue";
import NotfoundView from "@/views/not-found/index.vue";

const routes = [
  { path: "/", component: IndexView },
  { path: "/ai", component: AiView },
  { path: "/translate", component: TranslateView },
  { path: "/404", component: NotfoundView },
  { path: "/:pathMatch(.*)*", redirect: "/404" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
