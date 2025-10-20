import { createApp } from 'vue'
import App from './App.vue'
import "./style.css"
import MateChat from '@matechat/core';
import '@devui-design/icons/icomoon/devui-icon.css';
import router from '@/router';
import 'virtual:uno.css'

const app = createApp(App)
app.use(router).use(MateChat).mount('#app')