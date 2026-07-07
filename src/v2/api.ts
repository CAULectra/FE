/* ================================================================
   Lectra v2 — API 레이어
   지금은 목 구현이지만, 함수 시그니처 = 백엔드 실제 엔드포인트 스펙.
   실연동 시 각 함수 내부만 fetch로 교체한다. (호출부는 변경 없음)

   대응 엔드포인트 (lectra_BE / lectra_ai):
   - POST /lectures                      → (UploadModal → store.addLecture)
   - GET  /lectures/:id/study            → fetchStudyData
   - POST /api/rag/qa                    → ragQA          ★ 인용 칩 필수
   - POST /api/rag/quick                 → ragQuickAction
   - POST /lectures/:id/export           → requestExport
   ================================================================ */
import type { Citation, QAMessage, StudyData } from "./types";
import { getStudyData } from "./data";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function fetchStudyData(lectureId: string): Promise<StudyData> {
  await delay(150);
  return getStudyData(lectureId);
}

/** RAG Q&A — 답변에는 항상 근거 인용(slide, t)이 붙는다 (환각 방지 정책) */
export async function ragQA(_lectureId: string, question: string, contextSlide: number): Promise<QAMessage> {
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

export async function ragQuickAction(_lectureId: string, action: "summary" | "exam", slide: number): Promise<QAMessage> {
  await delay(1100);
  if (action === "summary") {
    return {
      role: "ai",
      text: `S${slide} 요약 — 이 슬라이드는 증명자가 비밀 x를 노출하지 않고 y = gˣ의 지식을 증명하는 과정을 다룹니다. 커밋(β) → 챌린지(c) → 응답(s = xc + α)의 3-move가 핵심이며, 검증은 gˢ = yᶜ·β 확인으로 끝납니다.`,
      citations: [{ slide, t: undefined }, { slide: 9, t: 1394 }],
    };
  }
  return {
    role: "ai",
    text: `예상 시험문제 3개:\n1) Schnorr 프로토콜의 검증식 gˢ = yᶜ·β가 성립함을 완전성 관점에서 유도하라.\n2) Fiat-Shamir 변환이 랜덤 오라클 모델에서 안전한 이유를 설명하라.\n3) 영지식 증명의 세 가지 성질을 정의하고, 알리바바 동굴 예시로 건전성을 설명하라.`,
    citations: [{ slide: 10, t: 1570 }, { slide: 11, t: 1810 }, { slide: 5 }],
  };
}

export type ExportFormat = "pdf" | "md" | "docx" | "srt" | "anki";
export const EXPORT_FORMATS: { key: ExportFormat; label: string; desc: string }[] = [
  { key: "pdf",  label: "PDF",            desc: "노트+슬라이드 병합" },
  { key: "md",   label: "Markdown (.md)", desc: "플레인 텍스트 노트" },
  { key: "docx", label: "Word (.docx)",   desc: "편집 가능한 문서" },
  { key: "srt",  label: "자막 (.srt)",     desc: "타임스탬프 스크립트" },
  { key: "anki", label: "Anki 카드 (.csv)", desc: "핵심 개념 플래시카드" },
];

export async function requestExport(lectureTitle: string, format: ExportFormat): Promise<string> {
  await delay(1400); // 백그라운드 생성 시뮬레이션
  const ext = format === "anki" ? "csv" : format;
  return `${lectureTitle.replace(/\s+/g, "_")}.${ext}`;
}
