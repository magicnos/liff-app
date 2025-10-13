import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // GitHub Pages の相対パス対応
  build: {
    outDir: 'dist', // ビルド先フォルダ
  },
})
