// ─── 응답 파싱 순수 헬퍼 — fetch/DOM 의존 없음. 단위 테스트 대상 (리뷰 #42) ──────

/** 에러 본문 → 사람용 메시지 — BE JSON {"detail": "..."} 우선 추출, 아니면 원문 */
export function errDetail(raw: string): string {
  try {
    const j = JSON.parse(raw) as { detail?: unknown };
    if (typeof j.detail === "string" && j.detail) return j.detail;
  } catch { /* JSON 아니면 원문 유지 */ }
  return raw;
}

/** Content-Disposition 헤더 → 다운로드 파일명.
 *  RFC 6266 우선순위: filename*=UTF-8''(URL 인코딩, RFC 5987) → filename="..." 폴백 → null.
 *  퍼센트 인코딩이 깨진 filename*는 무시하고 폴백으로 진행한다. */
export function contentDispositionFilename(cd: string | null): string | null {
  if (!cd) return null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(cd);
  if (star) {
    try { return decodeURIComponent(star[1].trim()); } catch { /* 깨진 인코딩 → 폴백 */ }
  }
  const plain = /filename="?([^";]+)"?/i.exec(cd);
  return plain ? plain[1].trim() : null;
}
