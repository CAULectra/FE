/* ================================================================
   AppV2 — 라우터 루트
   /            → 정식 랜딩 = 정적 v4 (/landing/index.html) 으로 이동
   /auth        → Google 단독 로그인
   /library     → AppShell(다크 글래스 사이드바) + Library
   /lecture/:id → 강의 단일 페이지 (Processing ↔ Study 자동 전환)
   ================================================================ */
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppProvider } from "./store";
import AppShell from "./AppShell";
import AuthPage from "./AuthPage";
import LibraryPage from "./LibraryPage";
import LecturePage from "./LecturePage";

/** 정식 랜딩은 SPA 밖의 정적 파일 — window.location으로 이탈 */
function LandingRedirect() {
  useEffect(() => { window.location.replace("/landing/index.html"); }, []);
  return null;
}

export default function AppV2() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingRedirect />} />
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
