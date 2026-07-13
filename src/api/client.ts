// ─── fetch 래퍼 (인증 헤더 첨부 · 에러 처리 · 401 자동 refresh · JSON/FormData) ──────

import { API_BASE_URL, getToken, getRefreshToken, setToken, setRefreshToken, clearToken, clearRefreshToken } from "./config";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ReqOpts { skipRefresh?: boolean } // /auth/* 는 자동갱신 제외(무한루프 방지)

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch { /* ignore */ }
    throw new ApiError(res.status, `${res.status} ${res.statusText} ${detail}`.trim());
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ── 401 자동 refresh (PR#77) ──
   access가 짧은 수명이라 만료되면 401. 저장된 refresh_token으로 새 쌍을 발급받아 재시도한다.
   동시 401이 여러 개 떠도 refresh는 1회만(공유 프라미스). 실패하면 세션 종료(토큰 정리). */
let refreshInFlight: Promise<boolean> | null = null;

function doRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const rt = getRefreshToken();
  if (!rt) return Promise.resolve(false);
  refreshInFlight = (async () => {
    try {
      const res = await fetch(API_BASE_URL + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) {
        // refresh 확정 실패(만료·폐기) → 토큰 정리 + 만료 이벤트. store가 받아 로그아웃 상태로.
        clearToken(); clearRefreshToken();
        if (typeof window !== "undefined") window.dispatchEvent(new Event("auth:expired"));
        return false;
      }
      const data = (await res.json()) as { access_token: string; refresh_token: string };
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      return true;
    } catch {
      return false; // 네트워크 오류는 토큰 유지(일시적일 수 있음)
    }
  })();
  void refreshInFlight.finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

/** 요청 실행 — 401이면 1회 refresh 후 재시도. init은 함수(재시도 시 갱신된 토큰 반영). */
async function request<T>(path: string, init: () => RequestInit, opts?: ReqOpts): Promise<T> {
  let res = await fetch(API_BASE_URL + path, init());
  if (res.status === 401 && !opts?.skipRefresh && getRefreshToken()) {
    const ok = await doRefresh();
    if (ok) res = await fetch(API_BASE_URL + path, init());
  }
  return handle<T>(res);
}

export function apiGet<T>(path: string, opts?: ReqOpts): Promise<T> {
  return request<T>(path, () => ({ headers: { ...authHeaders() } }), opts);
}

export function apiPostJson<T>(path: string, body: unknown, opts?: ReqOpts): Promise<T> {
  return request<T>(path, () => ({
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  }), opts);
}

export function apiPostForm<T>(path: string, form: FormData, opts?: ReqOpts): Promise<T> {
  // FormData는 Content-Type을 브라우저가 boundary와 함께 자동 설정하므로 지정하지 않음
  return request<T>(path, () => ({ method: "POST", headers: { ...authHeaders() }, body: form }), opts);
}

export function apiPatchJson<T>(path: string, body: unknown, opts?: ReqOpts): Promise<T> {
  return request<T>(path, () => ({
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  }), opts);
}

export function apiDelete(path: string, opts?: ReqOpts): Promise<void> {
  return request<void>(path, () => ({ method: "DELETE", headers: { ...authHeaders() } }), opts);
}
