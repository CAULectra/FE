import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const proxyTarget = env.VITE_API_PROXY_TARGET

  // 백엔드가 CORS 헤더를 주지 않아 브라우저 직접 호출이 막힘 → 개발 서버가 대신 프록시.
  // FastAPI 실제 라우트 접두사만 백엔드로 넘긴다.
  const proxy = proxyTarget
    ? Object.fromEntries(
        ['/auth', '/upload-pdf', '/lectures', '/slides', '/jobs'].map(p => [
          p,
          { target: proxyTarget, changeOrigin: true },
        ]),
      )
    : undefined

  return {
    server: { proxy },
    plugins: [
      react(),
      tailwindcss(),
      figmaAssetResolver(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],

    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // 큰 라이브러리를 별도 청크로 분리(캐싱·지연로드 효율)
          manualChunks(id: string) {
            if (id.includes('node_modules/three')) return 'three'
            if (id.includes('node_modules/katex')) return 'katex'
          },
        },
      },
    },
  }
})
