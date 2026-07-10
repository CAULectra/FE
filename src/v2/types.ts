/* ================================================================
   Lectra v2 — 도메인 타입
   백엔드(lectra_BE) 실연동 시 이 타입이 API 응답 스키마의 기준이 된다.
   ================================================================ */

export type LectureStatus = "uploading" | "queued" | "processing" | "failed" | "ready";

/** 처리 파이프라인 6단계 — 와이어프레임 4.0 기준 (정렬 = core step) */
export const PIPELINE_STEPS = [
  { key: "upload",  label: "Upload received",                  labelKo: "업로드",     sub: "파일 수신 및 검증" },
  { key: "stt",     label: "Speech-to-text transcription",     labelKo: "STT",        sub: "녹음 음성을 텍스트로 변환" },
  { key: "extract", label: "Slide text extraction",            labelKo: "텍스트 추출", sub: "슬라이드 텍스트·구조 추출" },
  { key: "align",   label: "Slide-transcript alignment",       labelKo: "정렬",       sub: "문장을 슬라이드에 정렬 (core step ★)" },
  { key: "notegen", label: "AI note generation",               labelKo: "노트 생성",   sub: "구조화된 학습 노트 작성" },
  { key: "ready",   label: "Ready",                            labelKo: "완료",       sub: "워크스페이스 준비 완료" },
] as const;

export interface Folder {
  id: string;
  name: string;
}

export interface Lecture {
  id: string;
  title: string;
  folderId: string;
  uploadedAt: string;        // ISO date
  updatedLabel: string;      // "Jun 28" 표시용
  status: LectureStatus;
  /** processing 전용 */
  progress: number;          // 0~100 overall
  stepIndex: number;         // 0~5 (PIPELINE_STEPS)
  etaMin?: number;
  failedStep?: number;       // status==="failed"일 때 실패한 단계 index
  errorCode?: string;        // e.g. "STT_TIMEOUT"
  queueOrder?: number;       // status==="queued"일 때 대기 순번
  /** 메타 */
  slideCount?: number;
  audioSec?: number;         // 녹음 길이(초). 없으면 문서 모드
  photoCount?: number;
  hasAudio: boolean;
}

/* ---------------- Study 워크스페이스 ---------------- */

export interface Slide {
  n: number;                 // S# (1-base)
  title: string;
  startSec: number;          // 정렬: 이 슬라이드 구간 시작
  endSec: number;
  dwellProf?: number;        // 체류시간(교수, 초) — 히트맵용
  img?: string;              // 슬라이드 렌더 이미지 경로 (실연동: PDF 페이지 렌더)
  isBoard?: boolean;
}

export interface ScriptSentence {
  id: string;
  slide: number;             // 앵커 S#
  t: number;                 // 시점(초)
  text: string;
}

/** AI 정리본 노트 블록 — 챕터 본문을 구성 */
export type NoteBlock =
  | { kind: "section"; title: string; body: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "code"; filename: string; code: string }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "callout"; emoji: string; text: string }
  | { kind: "math"; latex: string; caption?: string }
  | { kind: "viz"; viz: "schnorr-flow"; caption?: string }
  | { kind: "handwriting"; slide: number; t?: number; photoId: string; caption: string }
  | { kind: "audio"; slide: number; t: number; text: string };

/** AI 정리본은 챕터 단위 (초기 프로토타입 구조), 블록은 S#·시점에 앵커 */
export interface Chapter {
  idx: number;               // 0-base
  title: string;             // "Chapter 1"
  sub: string;               // 챕터 제목
  pages: string;             // "1~4페이지"
  slides: [number, number];  // 포함 슬라이드 범위 [start, end]
  intro: string;
  meta: string;              // "슬라이드 4장 · 판서 1장 · 녹음 12분 반영"
  summary: string[];         // 핵심 요약 불릿
  blocks: NoteBlock[];
  /** note-v2: 백엔드 chapters[].summary_note(마크다운). 있으면 NotePane이 MarkdownNote로 렌더 */
  noteMd?: string;
}

export interface Photo {
  id: string;
  slide: number;
  t?: number;                // 촬영 시각(EXIF) 기반 정렬 시점. 없으면 업로드 순
  label: string;
  img?: string;              // 사진 파일 경로 (실연동: 업로드 이미지 URL)
}

/** RAG Q&A — POST /api/rag/qa 응답 스키마 기준 (인용 칩 필수) */
export interface Citation {
  slide: number;
  t?: number;
}
export interface QAMessage {
  role: "user" | "ai";
  text: string;
  citations?: Citation[];
}

export interface StudyData {
  lectureId: string;
  courseName: string;        // "정보보호이론"
  defaultSlide: number;      // 데모 진입 시 시작 슬라이드
  durationSec: number;
  slides: Slide[];
  script: ScriptSentence[];
  chapters: Chapter[];
  photos: Photo[];
  overall: string;           // 전체 강의자료 총 요약
  /** 번역 탭 — 번역된 내용만 노출 (원문 병기 없음) */
  chaptersEn: { title: string; summary: string[] }[];
  overallEn: string;
}

export const fmtTime = (sec: number): string => {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

/** 현재 슬라이드가 속한 챕터 index */
export const chapterOfSlide = (chapters: Chapter[], slideN: number): number => {
  const i = chapters.findIndex((c) => slideN >= c.slides[0] && slideN <= c.slides[1]);
  return i === -1 ? 0 : i;
};
