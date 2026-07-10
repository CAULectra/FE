/* ================================================================
   AppV2 — 라우터 루트
   /            → 랜딩 (src/landing/LandingPage, 지연 로드)
   /auth        → Google 단독 로그인
   /library     → AppShell(다크 글래스 사이드바) + Library
   /lecture/:id → 강의 단일 페이지 (Processing ↔ Study 자동 전환, 지연 로드)
   ================================================================ */
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppProvider } from "./store";
import AppShell from "./AppShell";
import AuthPage from "./AuthPage";
import LibraryPage from "./LibraryPage";
import WorkspacePage from "./WorkspacePage";

/* 무거운 leaf 라우트는 지연 로드 → 초기 번들에서 three.js/katex 분리 */
const LandingPage = lazy(() => import("../landing/LandingPage"));
const LecturePage = lazy(() => import("./LecturePage"));
const NoteMarkdownDemo = lazy(() => import("./NoteMarkdownDemo"));

/* 랜딩 폴백: 히어로 배경 그라데이션과 동일 색이라 청크 로드 중 흰 플래시 없음 */
const HeroFallback = () => (
  <div
    aria-hidden
    className="fixed inset-0"
    style={{ background: "linear-gradient(115deg,#e94b6e 0%,#f2646a 30%,#f88d64 62%,#fcae72 100%)" }}
  />
);

const PageFallback = () => (
  <div className="fixed inset-0 grid place-items-center bg-background">
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
  </div>
);

export default function AppV2() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Suspense fallback={<HeroFallback />}><LandingPage /></Suspense>}
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/note"
            element={<Suspense fallback={<PageFallback />}><NoteMarkdownDemo /></Suspense>}
          />
          <Route element={<AppShell />}>
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route
              path="/lecture/:id"
              element={<Suspense fallback={<PageFallback />}><LecturePage /></Suspense>}
            />
          </Route>
          <Route path="*" element={<Navigate to="/library" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
