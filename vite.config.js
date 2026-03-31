import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        feignTracker: 'feign-tracker.html',
        codePulse: 'codepulse.html',
      },
    },
  },
})
