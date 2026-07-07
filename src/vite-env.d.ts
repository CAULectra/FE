/// <reference types="vite/client" />

// import.meta.env 를 명시적으로 선언 (IDE가 vite/client 타입을 못 읽어도 안전)
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_MOCK_LOGIN: string;
  readonly VITE_API_PROXY_TARGET: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
