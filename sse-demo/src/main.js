import { createApp } from 'vue'
import App from './App.vue'
import "./style.css"
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import MateChat from '@matechat/core';
import '@devui-design/icons/icomoon/devui-icon.css';

const app = createApp(App)
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(MateChat).mount('#app')