// ─── API 진입점 ───────────────────────────────────────────────────────────────
// import { api } from "@/api";  형태로 사용. USE_MOCK 플래그로 목/실제 자동 전환.

import { USE_MOCK, MOCK_LOGIN } from "./config";
import { mockApi } from "./mock";
import { realApi } from "./real";

export * from "./types";
export { API_BASE_URL, USE_MOCK, getToken, setToken, clearToken, getRefreshToken, setRefreshToken, clearRefreshToken, getUser, setUser, clearUser } from "./config";
export { ApiError } from "./client";

// USE_MOCK: 전부 목. 아니면 실제 백엔드를 쓰되, MOCK_LOGIN이면 로그인만 목으로 대체.
export const api = USE_MOCK
  ? mockApi
  : MOCK_LOGIN
    ? { ...realApi, loginGoogle: mockApi.loginGoogle }
    : realApi;
