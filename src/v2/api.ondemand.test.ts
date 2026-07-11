import { describe, it, expect, vi, beforeEach } from "vitest";

/* mock/real 게이트는 src/api 레이어에 있으므로, 여기선 backend(../api)를 vi.mock으로
   주입해 v2 래퍼의 "형태 변환"만 검증한다 (네트워크 경계 = 유일하게 목이 불가피한 지점). */
vi.mock("../api", () => ({
  USE_MOCK: false,
  api: {
    slideSummary: vi.fn(),
    translateSlide: vi.fn(),
    chapterSummaryExplain: vi.fn(),
  },
}));

import * as backend from "../api";
import { slideSummary, translateSlideText, chapterExplain } from "./api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("v2 on-demand 래퍼", () => {
  it("slideSummary: BE {slide_number,summary} → QAMessage(ai, 인용 없음)", async () => {
    (backend.api.slideSummary as ReturnType<typeof vi.fn>).mockResolvedValue({
      slide_number: 5,
      summary: "이 슬라이드 핵심 요약",
    });
    const msg = await slideSummary("lec-1", 5);
    expect(msg).toEqual({ role: "ai", text: "이 슬라이드 핵심 요약" });
    expect(msg.citations).toBeUndefined();
    expect(backend.api.slideSummary).toHaveBeenCalledWith("lec-1", 5);
  });

  it("translateSlideText: BE {translated_text} → 문자열만 반환", async () => {
    (backend.api.translateSlide as ReturnType<typeof vi.fn>).mockResolvedValue({
      slide_number: 2,
      target_language: "en",
      translated_text: "Translated body.",
    });
    const out = await translateSlideText("lec-1", 2, "en");
    expect(out).toBe("Translated body.");
    expect(backend.api.translateSlide).toHaveBeenCalledWith("lec-1", 2, "en");
  });

  it("translateSlideText: 이미지-only 슬라이드는 빈 문자열 그대로 통과", async () => {
    (backend.api.translateSlide as ReturnType<typeof vi.fn>).mockResolvedValue({
      slide_number: 9,
      target_language: "ja",
      translated_text: "",
    });
    expect(await translateSlideText("lec-1", 9, "ja")).toBe("");
  });

  it("chapterExplain: BE {summary_explain} → 문자열만 반환", async () => {
    (backend.api.chapterSummaryExplain as ReturnType<typeof vi.fn>).mockResolvedValue({
      chapter_number: 1,
      summary_explain: "이 챕터를 풀어서 설명하면…",
    });
    const out = await chapterExplain("lec-1", 1);
    expect(out).toBe("이 챕터를 풀어서 설명하면…");
    expect(backend.api.chapterSummaryExplain).toHaveBeenCalledWith("lec-1", 1);
  });
});
