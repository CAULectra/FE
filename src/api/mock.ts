// ─── 목(mock) 구현 — 백엔드 없이 동일 인터페이스로 동작 ────────────────────────
// VITE_USE_MOCK !== "false" 이면 이 구현이 사용됩니다. 반환 형식은 BE 계약과 동일.

import type { BackendStatus, LectraApi, LectureListItem } from "./types";

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

const MOCK_LECTURES: LectureListItem[] = [
  { id: "mock-lec-1", title: "소프트웨어 공학", status: "완료", created_at: "2026-06-30T09:00:00Z" },
  { id: "mock-lec-2", title: "자료구조",       status: "처리중", created_at: "2026-06-28T09:00:00Z" },
];

// 폴더 목 — mock 모드 store는 SEED_FOLDERS를 쓰므로 실제로는 안 불리지만, 인터페이스 충족용.
let MOCK_FOLDERS: { id: string; name: string }[] = [
  { id: "mf-1", name: "정보보호이론" },
  { id: "mf-2", name: "알고리즘" },
];

// job_id별 시작 시각·대상 강의를 기억해 progress를 시간에 따라 증가시킴
const jobStart = new Map<string, { start: number; lectureId: string }>();
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
    return { lecture_id: "mock-lec-" + Date.now() };
  },
  async uploadAudio(_lectureId, _audio) {
    await delay(400);
    return { ok: true };
  },
  async uploadBoard(_lectureId, images) {
    await delay(400);
    return { board_count: images.length };
  },
  async process(lectureId) {
    await delay(300);
    const jobId = "mock-job-" + Date.now();
    jobStart.set(jobId, { start: Date.now(), lectureId });
    return { job_id: jobId, status: "대기" };
  },
  async getJob(jobId) {
    let entry = jobStart.get(jobId);
    if (entry === undefined) { entry = { start: Date.now(), lectureId: "mock-lec-1" }; jobStart.set(jobId, entry); }
    const progress = Math.min(100, Math.round((Date.now() - entry.start) / 150)); // ~15초에 완료
    const done = progress >= 100;
    const idx = Math.min(MOCK_STEPS.length - 1, Math.floor(progress / (100 / MOCK_STEPS.length)));
    return {
      job_id: jobId,
      status: done ? "완료" : MOCK_STEPS[idx],
      progress,
      lecture_id: entry.lectureId,
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
  async listFolders() {
    await delay(150);
    return MOCK_FOLDERS.map((f) => ({ ...f }));
  },
  async createFolder(name) {
    await delay(150);
    const trimmed = name.trim();
    const existing = MOCK_FOLDERS.find((f) => f.name === trimmed);
    if (existing) return { ...existing };
    const f = { id: "mf-" + Date.now(), name: trimmed };
    MOCK_FOLDERS.push(f);
    return { ...f };
  },
  async renameFolder(folderId, name) {
    await delay(150);
    const trimmed = name.trim();
    const f = MOCK_FOLDERS.find((x) => x.id === folderId);
    if (f) f.name = trimmed;
    return { id: folderId, name: trimmed };
  },
  async deleteFolder(folderId) {
    await delay(150);
    MOCK_FOLDERS = MOCK_FOLDERS.filter((f) => f.id !== folderId);
  },
  async updateLectureFolder(lectureId, folderId) {
    await delay(150);
    return { lecture_id: lectureId, folder_id: folderId };
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
  async qa(_lectureId, question, _topK) {
    await delay(600);
    return {
      question,
      answer: `(mock) "${question}"에 대한 답변입니다. 강의 자료 근거로 생성된 예시 응답이에요.`,
      sources: [
        { slide_number: 1, title: "슬라이드 1", score: 0.9, chunk_text: "관련 근거 발췌 (mock)" },
      ],
    };
  },
};
