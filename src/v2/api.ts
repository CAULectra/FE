/* ================================================================
   Lectra v2 — API 레이어
   지금은 목 구현이지만, 함수 시그니처 = 백엔드 실제 엔드포인트 스펙.
   실연동 시 각 함수 내부만 fetch로 교체한다. (호출부는 변경 없음)

   대응 엔드포인트 (lectra_BE / lectra_ai):
   - POST /lectures                      → createLecture  (파일 업로드)
   - GET  /lectures/:id                  → (store에서 관리)
   - GET  /lectures/:id/study            → fetchStudyData
   - POST /api/rag/qa                    → ragQA          ★ 인용 칩 필수
   - POST /api/rag/quick                 → ragQuickAction
   - POST /api/translate/section         → translateSection
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
  const citations: Citation[] = [
    { slide: 12, t: 1394 },
    { slide: 13, t: 1502 },
  ];
  if (/중앙값|median/i.test(question)) {
    return {
      role: "ai",
      text: "중앙값으로 나누면 분할된 양쪽 노드가 키를 절반씩 갖게 되어 이후 삽입 여유가 균등해집니다. 최악 높이가 로그로 보장되는 이유이기도 합니다.",
      citations,
    };
  }
  return {
    role: "ai",
    text: `강의 원문을 근거로 답변합니다: "${question}" 관련 내용은 S${contextSlide} 구간에서 다뤄졌어요. 핵심은 노드 분할 시 중앙값 승격으로 트리 균형이 유지된다는 점입니다.`,
    citations: [{ slide: contextSlide, t: undefined }, ...citations.slice(0, 1)],
  };
}

export async function ragQuickAction(_lectureId: string, action: "summary" | "exam", slide: number): Promise<QAMessage> {
  await delay(1100);
  if (action === "summary") {
    return {
      role: "ai",
      text: `S${slide} 요약 — 가득 찬 노드에 키가 들어오면 중앙값 기준으로 분할하고, 중앙값만 부모로 승격합니다. 루트가 분할될 때만 트리 높이가 1 증가합니다.`,
      citations: [{ slide, t: 1394 }],
    };
  }
  return {
    role: "ai",
    text: `예상 시험문제 3개:\n1) B-Tree 삽입 시 노드 오버플로가 발생하면 어떤 절차로 처리되는가?\n2) 분할 시 중앙값을 승격하는 이유를 트리 높이 관점에서 설명하라.\n3) B-Tree의 높이가 증가하는 유일한 경우는 언제인가?`,
    citations: [{ slide: 12, t: 1394 }, { slide: 13, t: 1560 }],
  };
}

export async function translateSection(_sectionId: string, original: string): Promise<string> {
  await delay(700);
  return `(재번역) ${original.slice(0, 24)}… 에 대한 새 번역 결과입니다. 중앙값 분할과 승격 과정이 핵심입니다.`;
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
