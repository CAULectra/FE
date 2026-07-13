// ─── API 설정 & 인증 토큰 저장소 ──────────────────────────────────────────────

import type { LoginUser } from "./types";

// 백엔드 주소. 배포 전에는 로컬 서버 주소를 .env(VITE_API_BASE_URL)에 넣으세요.
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "";

// VITE_USE_MOCK=false 로 두기 전까지는 목 데이터로 동작합니다.
export const USE_MOCK: boolean = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";

// VITE_MOCK_LOGIN=true → 로그인(loginGoogle)만 목으로 처리, 나머지 API는 실제 백엔드 호출.
//   백엔드 /auth/login/google 미구현 상태에서 화면 테스트용. 완성되면 false 로.
export const MOCK_LOGIN: boolean = (import.meta.env.VITE_MOCK_LOGIN ?? "false") === "true";

// JWT 토큰 (로그인 연동 시 setToken 사용). 지금은 저장된 값이 있으면 헤더에 자동 첨부.
const TOKEN_KEY = "lectra_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Refresh 토큰 (PR#77) — access가 짧은 수명이라 만료 시 /auth/refresh 로 갱신.
const REFRESH_KEY = "lectra_refresh";

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}
export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_KEY);
}

// 로그인 사용자 정보 (이름·이메일·프로필). 새로고침해도 유지되도록 localStorage에 보관.
const USER_KEY = "lectra_user";

export function getUser(): LoginUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as LoginUser; } catch { return null; }
}
export function setUser(user: LoginUser | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}
export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

// ── 삭제한 강의 tombstone (클라이언트) ──────────────────────────────────────────
//   BE에 강의 DELETE 엔드포인트가 없어, 삭제한 강의를 새로고침(GET /lectures 재요청) 후에도
//   숨기려면 id를 로컬에 보관한다. 실제 삭제 API가 생기면 제거하고 서버 DELETE로 대체.
const DELETED_KEY = "lectra_deleted_lectures";

export function getDeletedLectureIds(): string[] {
  const raw = localStorage.getItem(DELETED_KEY);
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}
export function addDeletedLectureId(id: string): void {
  const cur = getDeletedLectureIds();
  if (cur.includes(id)) return;
  localStorage.setItem(DELETED_KEY, JSON.stringify([...cur, id]));
}
