// ─── fetch 래퍼 (인증 헤더 첨부 · 에러 처리 · JSON/FormData) ────────────────────

import { API_BASE_URL, getToken } from "./config";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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

export function apiGet<T>(path: string): Promise<T> {
  return fetch(API_BASE_URL + path, { headers: { ...authHeaders() } }).then(handle<T>);
}

export function apiPostJson<T>(path: string, body: unknown): Promise<T> {
  return fetch(API_BASE_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  }).then(handle<T>);
}

export function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  // FormData는 Content-Type을 브라우저가 boundary와 함께 자동 설정하므로 지정하지 않음
  return fetch(API_BASE_URL + path, {
    method: "POST",
    headers: { ...authHeaders() },
    body: form,
  }).then(handle<T>);
}

export function apiPatchJson<T>(path: string, body: unknown): Promise<T> {
  return fetch(API_BASE_URL + path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  }).then(handle<T>);
}

export function apiDelete(path: string): Promise<void> {
  return fetch(API_BASE_URL + path, { method: "DELETE", headers: { ...authHeaders() } }).then(handle<void>);
}
