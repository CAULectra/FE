/* ================================================================
   AppV2 — 라우터 루트
   /            → /library 리다이렉트 (랜딩은 /landing/index.html 정적)
   /auth        → Google 단독 로그인
   /library     → AppShell(다크 글래스 사이드바) + Library
   /lecture/:id → 강의 단일 페이지 (Processing ↔ Study 자동 전환)
   ================================================================ */
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppProvider } from "./store";
import AppShell from "./AppShell";
import AuthPage from "./AuthPage";
import LibraryPage from "./LibraryPage";
import LecturePage from "./LecturePage";

export default function AppV2() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<AppShell />}>
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/lecture/:id" element={<LecturePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/library" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
