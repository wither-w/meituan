import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'MeituanVueHelper',
      fileName: (format) => `meituan-vue-${format}.js`,
      formats: ['iife']
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false
      }
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
})
