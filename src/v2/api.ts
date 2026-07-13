/* ================================================================
   Lectra v2 — API 레이어
   지금은 목 구현이지만, 함수 시그니처 = 백엔드 실제 엔드포인트 스펙.
   실연동 시 각 함수 내부만 fetch로 교체한다. (호출부는 변경 없음)

   대응 엔드포인트 (lectra_BE / lectra_ai):
   - POST /lectures                      → (UploadModal → store.addLecture)
   - GET  /lectures/:id/study            → fetchStudyData
   - POST /lectures/:id/qa               → ragQA          ★ 인용 칩 필수
   - POST /api/rag/quick                 → ragQuickAction
   - POST /lectures/:id/export           → requestExport
   ================================================================ */
import type { Citation, QAMessage, StudyData } from "./types";
import { getStudyData } from "./data";
import { USE_MOCK, api as backend } from "../api";
import { resultDictToStudyData } from "./studyAdapter";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function fetchStudyData(lectureId: string): Promise<StudyData> {
  // 목업 모드: 로컬 데모 데이터(STUDY_ZK 등)
  if (USE_MOCK) {
    await delay(150);
    return getStudyData(lectureId);
  }
  // 실서버: GET /lectures/{id} → result(ResultDict) → StudyData
  const detail = await backend.getLecture(lectureId);
  if (!detail.result) {
    throw new Error(detail.status === "완료" ? "강의 결과가 비어 있습니다." : "아직 처리 중인 강의입니다.");
  }
  return resultDictToStudyData(detail.result, lectureId, detail.pdf_url);
}

/* ── on-demand 3종 (backend는 src/api에서 이미 mock/real 게이트됨 → 형태만 변환) ── */

/** 슬라이드 요약 (POST /lectures/{id}/slides/{n}/summary) → 챗 스레드용 QAMessage. 인용 없음. */
export async function slideSummary(lectureId: string, slideNumber: number): Promise<QAMessage> {
  const r = await backend.slideSummary(lectureId, slideNumber);
  return { role: "ai", text: r.summary };
}

/** 슬라이드 번역 (POST /lectures/{id}/slides/{n}/translate) → 번역문만. 이미지-only 슬라이드는 "" 반환. */
export async function translateSlideText(lectureId: string, slideNumber: number, targetLang: string): Promise<string> {
  const r = await backend.translateSlide(lectureId, slideNumber, targetLang);
  return r.translated_text;
}

/** 챕터 설명형 요약 (POST /lectures/{id}/chapters/{n}/summary-explain) → 설명 텍스트(마크다운). */
export async function chapterExplain(lectureId: string, chapterNumber: number): Promise<string> {
  const r = await backend.chapterSummaryExplain(lectureId, chapterNumber);
  return r.summary_explain;
}

/** RAG Q&A — 실모드: POST /lectures/{id}/qa → sources[]를 인용 칩(slide)으로 변환.
 *  근거를 못 찾으면 sources=[]로 오지만, 그 경우 BE answer가 "관련 내용을 찾지 못함" 안내라 인용 없이도 자연스럽다
 *  (환각 방지는 BE가 근거 기반으로만 답하도록 보장하는 정책 — FE는 그 sources를 그대로 노출). 목모드: 데모 캔 답변. */
export async function ragQA(lectureId: string, question: string, contextSlide: number): Promise<QAMessage> {
  if (!USE_MOCK) {
    // 실서버: POST /lectures/{id}/qa → sources[]를 인용 칩(slide)으로 변환
    const r = await backend.qa(lectureId, question);
    return {
      role: "ai",
      text: r.answer,
      citations: r.sources.map((s) => ({ slide: s.slide_number })),
    };
  }
  await delay(900);
  if (/fiat|비대화|해시|안전/i.test(question)) {
    return {
      role: "ai",
      text: "Fiat-Shamir 변환은 검증자의 무작위 챌린지 c를 해시 c = H(β, y)로 대체합니다. 해시 출력이 예측 불가능하므로(랜덤 오라클 가정) 증명자가 챌린지를 미리 알고 조작할 수 없어, 대화형 프로토콜의 건전성이 그대로 유지됩니다.",
      citations: [{ slide: 11, t: 1810 }, { slide: 12, t: 2050 }],
    };
  }
  if (/건전성|soundness|추출/i.test(question)) {
    return {
      role: "ai",
      text: "같은 β에 대해 서로 다른 두 챌린지의 유효한 응답 (c, s), (c′, s′)가 있으면 gˢ⁻ˢ′ = yᶜ⁻ᶜ′ 이므로 x = (s−s′)/(c−c′)로 witness가 계산됩니다. 이 '지식 추출기'의 존재가 곧 건전성의 증명입니다.",
      citations: [{ slide: 10, t: 1650 }],
    };
  }
  const citations: Citation[] = [{ slide: contextSlide }, { slide: 9, t: 1394 }];
  return {
    role: "ai",
    text: `강의 원문을 근거로 답변합니다: "${question}" 관련 내용은 S${contextSlide} 구간에서 다뤄졌어요. 핵심 축은 Σ-프로토콜(커밋→챌린지→응답)이 영지식 3성질을 만족하도록 설계된다는 점입니다.`,
    citations,
  };
}

// 노트 내보내기 — 프론트에서 즉시 생성 가능한 포맷만 (구현: study/exporters.ts).
//   PDF(슬라이드 병합)·Word(.docx)는 FE로 부적합 → 메뉴에서 제외(BE 지원 시 재추가).
export type { ExportFormat } from "./study/exporters";
import type { ExportFormat } from "./study/exporters";
export const EXPORT_FORMATS: { key: ExportFormat; label: string; desc: string }[] = [
  { key: "md",   label: "Markdown (.md)",  desc: "플레인 텍스트 노트" },
  { key: "srt",  label: "자막 (.srt)",      desc: "타임스탬프 스크립트" },
  { key: "anki", label: "Anki 카드 (.csv)", desc: "핵심 개념 플래시카드" },
];
