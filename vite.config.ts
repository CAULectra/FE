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
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
