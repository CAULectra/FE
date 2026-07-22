import { describe, it, expect } from "vitest";
import { errDetail, contentDispositionFilename } from "./parse";

describe("errDetail — 에러 본문에서 사람용 메시지 추출 (리뷰 #42)", () => {
  it("BE JSON의 detail 문자열을 꺼낸다 → 토스트에 raw JSON 노출 방지", () => {
    expect(errDetail('{"detail": "아직 처리 중인 강의입니다."}')).toBe("아직 처리 중인 강의입니다.");
  });
  it("detail이 없는 JSON은 원문 유지", () => {
    expect(errDetail('{"error": "oops"}')).toBe('{"error": "oops"}');
  });
  it("detail이 문자열이 아니면(객체 등) 원문 유지", () => {
    expect(errDetail('{"detail": {"code": 1}}')).toBe('{"detail": {"code": 1}}');
  });
  it("JSON이 아니면 원문 그대로", () => {
    expect(errDetail("Internal Server Error")).toBe("Internal Server Error");
  });
  it("빈 본문은 빈 문자열 → 호출부에서 status 라인 폴백", () => {
    expect(errDetail("")).toBe("");
  });
});

describe("contentDispositionFilename — 다운로드 파일명 파싱 (리뷰 #42)", () => {
  it("RFC 5987 filename*=UTF-8'' 한글 파일명을 디코드한다", () => {
    const name = "소프트웨어 공학_노트.pdf";
    const cd = `attachment; filename*=UTF-8''${encodeURIComponent(name)}`;
    expect(contentDispositionFilename(cd)).toBe(name);
  });
  it("filename*와 filename이 같이 오면 filename*가 우선 (RFC 6266)", () => {
    const cd = `attachment; filename="fallback.pdf"; filename*=UTF-8''${encodeURIComponent("실제.pdf")}`;
    expect(contentDispositionFilename(cd)).toBe("실제.pdf");
  });
  it('따옴표 있는 filename="..." 폴백', () => {
    expect(contentDispositionFilename('attachment; filename="report.pdf"')).toBe("report.pdf");
  });
  it("따옴표 없는 filename= 폴백", () => {
    expect(contentDispositionFilename("attachment; filename=plain.pdf")).toBe("plain.pdf");
  });
  it("깨진 퍼센트 인코딩은 무시하고 filename 폴백으로 진행", () => {
    const cd = `attachment; filename="ok.pdf"; filename*=UTF-8''%E0%A4%A`;
    expect(contentDispositionFilename(cd)).toBe("ok.pdf");
  });
  it("파일명 정보가 전혀 없으면 null", () => {
    expect(contentDispositionFilename("attachment")).toBeNull();
  });
  it("헤더 자체가 없으면(null) null", () => {
    expect(contentDispositionFilename(null)).toBeNull();
  });
});
