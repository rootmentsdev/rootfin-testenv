import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
  build: {
    // Increase chunk warning limit (we have many pages)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor libraries into separate cached chunks
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-select', 'react-toastify', 'lucide-react', 'react-icons'],
          'pdf-vendor': ['html2pdf.js'],
          'qr-vendor': ['html5-qrcode'],
        },
      },
    },
    // Minify with esbuild (default, very fast)
    minify: 'esbuild',
    // Enable source maps only in dev
    sourcemap: false,
    // Target modern browsers (smaller output)
    target: 'es2020',
  },
})
