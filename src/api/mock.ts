// ─── 목(mock) 구현 — 백엔드 없이 동일 인터페이스로 동작 ────────────────────────
// VITE_USE_MOCK !== "false" 이면 이 구현이 사용됩니다. 반환 형식은 BE 계약과 동일.

import type { BackendStatus, LectraApi, LectureListItem } from "./types";

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

const MOCK_LECTURES: LectureListItem[] = [
  { id: "mock-lec-1", title: "소프트웨어 공학", status: "완료", created_at: "2026-06-30T09:00:00Z" },
  { id: "mock-lec-2", title: "자료구조",       status: "처리중", created_at: "2026-06-28T09:00:00Z" },
];

// job_id별 시작 시각을 기억해 progress를 시간에 따라 증가시킴
const jobStart = new Map<string, number>();
const MOCK_STEPS: BackendStatus[] = ["추출", "매핑", "챕터", "요약", "인덱싱"];

export const mockApi: LectraApi = {
  async loginGoogle(_code) {
    await delay(400);
    return {
      access_token: "mock-jwt-" + Date.now(),
      token_type: "Bearer",
      user: { id: "1", name: "김학생", email: "student@univ.ac.kr" },
    };
  },
  async uploadPdf(_title, _pdf) {
    await delay(600);
    return { lecture_id: "mock-lec-1" };
  },
  async uploadAudio(_lectureId, _audio) {
    await delay(400);
    return { ok: true };
  },
  async uploadBoard(_lectureId, images) {
    await delay(400);
    return { board_count: images.length };
  },
  async process(_lectureId) {
    await delay(300);
    const jobId = "mock-job-" + Date.now();
    jobStart.set(jobId, Date.now());
    return { job_id: jobId, status: "대기" };
  },
  async getJob(jobId) {
    let start = jobStart.get(jobId);
    if (start === undefined) { start = Date.now(); jobStart.set(jobId, start); }
    const progress = Math.min(100, Math.round((Date.now() - start) / 150)); // ~15초에 완료
    const done = progress >= 100;
    const idx = Math.min(MOCK_STEPS.length - 1, Math.floor(progress / (100 / MOCK_STEPS.length)));
    return {
      job_id: jobId,
      status: done ? "완료" : MOCK_STEPS[idx],
      progress,
      lecture_id: "mock-lec-1",
    };
  },
  async getLectures() {
    await delay(300);
    return MOCK_LECTURES;
  },
  async getLecture(_lectureId) {
    await delay(300);
    return { status: "대기", error: null, result: null };
  },
  async translateSlide(_lectureId, slideNumber, targetLanguage) {
    await delay(500);
    return {
      slide_number: slideNumber,
      target_language: targetLanguage,
      translated_text: `[${targetLanguage}] 번역된 슬라이드 내용 (mock)`,
    };
  },
  async slideSummary(_lectureId, slideNumber) {
    await delay(500);
    return { slide_number: slideNumber, summary: `S${slideNumber} 요약 (mock)` };
  },
  async chapterSummaryExplain(_lectureId, chapterNumber) {
    await delay(500);
    return { chapter_number: chapterNumber, summary_explain: `Chapter ${chapterNumber} 해설 (mock)` };
  },
};
