import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  base: './',
  define: {
    APP_VERSION: JSON.stringify(pkg.version),
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['electron', 'serialport', 'child_process', 'fs', 'path', 'os']
    }
  },
  server: { port: 5173 }
})
