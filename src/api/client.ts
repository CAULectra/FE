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

/** 에러 본문 → 사람용 메시지 — BE JSON {"detail": "..."} 우선 추출, 아니면 원문 (리뷰 #42) */
function errDetail(raw: string): string {
  try {
    const j = JSON.parse(raw) as { detail?: unknown };
    if (typeof j.detail === "string" && j.detail) return j.detail;
  } catch { /* JSON 아니면 원문 유지 */ }
  return raw;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let raw = "";
    try { raw = await res.text(); } catch { /* ignore */ }
    const detail = errDetail(raw);
    // detail(한국어 안내)이 있으면 그대로 토스트에 노출, 없으면 status 라인 폴백
    throw new ApiError(res.status, detail || `${res.status} ${res.statusText}`.trim());
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
      if (res.status === 401) {
        // 401 = refresh 토큰 만료/폐기(확정 실패) → 토큰 정리 + 만료 이벤트로 로그아웃 동기화.
        clearToken(); clearRefreshToken();
        if (typeof window !== "undefined") window.dispatchEvent(new Event("auth:expired"));
        return false;
      }
      if (!res.ok) return false; // 5xx 등 일시적 서버 오류 — 토큰 유지(다음 요청에서 재시도 여지)
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

/** fetch + 401 자동 refresh 1회 재시도 — JSON(request)·Blob(apiGetBlob) 공용 (리뷰 #42 중복 제거) */
async function fetchWithRefresh(path: string, init: () => RequestInit, opts?: ReqOpts): Promise<Response> {
  let res = await fetch(API_BASE_URL + path, init());
  if (res.status === 401 && !opts?.skipRefresh && getRefreshToken()) {
    const ok = await doRefresh();
    if (ok) res = await fetch(API_BASE_URL + path, init());
  }
  return res;
}

/** 요청 실행 — 401이면 1회 refresh 후 재시도. init은 함수(재시도 시 갱신된 토큰 반영). */
async function request<T>(path: string, init: () => RequestInit, opts?: ReqOpts): Promise<T> {
  return handle<T>(await fetchWithRefresh(path, init, opts));
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

/** 바이너리 다운로드(GET) — JSON 대신 Blob 반환. 401 자동 refresh는 request()와 동일 흐름.
 *  filename은 Content-Disposition의 RFC 5987 filename*=UTF-8'' 값을 디코드(없으면 null). */
export async function apiGetBlob(path: string, opts?: ReqOpts): Promise<{ blob: Blob; filename: string | null }> {
  const res = await fetchWithRefresh(path, () => ({ headers: { ...authHeaders() } }), opts);
  if (!res.ok) {
    let raw = "";
    try { raw = await res.text(); } catch { /* ignore */ }
    const detail = errDetail(raw);
    throw new ApiError(res.status, detail || `${res.status} ${res.statusText}`.trim());
  }
  const cd = res.headers.get("content-disposition") ?? "";
  const m = /filename\*=UTF-8''([^;]+)/i.exec(cd);
  let filename: string | null = null;
  if (m) { try { filename = decodeURIComponent(m[1].trim()); } catch { filename = null; } }
  return { blob: await res.blob(), filename };
}
