import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    // 放宽单块大小告警阈值，配合手动分包减少大块
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue-devui')) return 'vendor-devui'
            if (id.includes('@matechat')) return 'vendor-matechat'
            return 'vendor'
          }
        }
      }
    }
  }
})
