import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AppV2 from "./v2/AppV2.tsx";
import "./styles/index.css";

/* 진입점 = AppV2 (랜딩 + 새 UI). 구 App(백엔드 연동 결과 화면)은 코드로 보존 — 추후 통합 예정.
   GoogleOAuthProvider는 백엔드 구글 로그인 연동(팀 작업)을 위해 유지. */
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <AppV2 />
  </GoogleOAuthProvider>
);
