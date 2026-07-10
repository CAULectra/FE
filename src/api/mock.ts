// ─── 목(mock) 구현 — 백엔드 없이 동일 인터페이스로 동작 ────────────────────────
// VITE_USE_MOCK !== "false" 이면 이 구현이 사용됩니다.

import type { Lecture, LectraApi } from "./types";

const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

const MOCK_LECTURES: Lecture[] = [
  {
    id: 1,
    title: "소프트웨어 공학",
    pdf_path: "/mock/software-engineering.pdf",
    created_at: "2026-06-30T09:00:00Z",
    slides: [
      { id: 101, page_num: 1, image_path: "/mock/1.png", text_content: "소프트웨어 공학 개요", ocr_text: "Introduction" },
      { id: 102, page_num: 2, image_path: "/mock/2.png", text_content: "소프트웨어 생명주기", ocr_text: "SDLC" },
      { id: 103, page_num: 3, image_path: "/mock/3.png", text_content: "요구사항 분석", ocr_text: "Requirements" },
    ],
  },
  {
    id: 2,
    title: "자료구조",
    pdf_path: "/mock/data-structure.pdf",
    created_at: "2026-06-28T09:00:00Z",
    slides: [
      { id: 201, page_num: 1, image_path: "/mock/ds1.png", text_content: "배열과 연결리스트", ocr_text: "Array / Linked List" },
      { id: 202, page_num: 2, image_path: "/mock/ds2.png", text_content: "스택과 큐", ocr_text: "Stack / Queue" },
    ],
  },
];

// job_id별 시작 시각을 기억해 progress를 시간에 따라 증가시킴
const jobStart = new Map<string, number>();
const MOCK_STATUSES = ["PDF 분석", "음성 STT", "판서 분석", "매핑중", "노트 생성"];

export const mockApi: LectraApi = {
  async loginGoogle(_code) {
    await delay(400);
    return {
      access_token: "mock-jwt-" + Date.now(),
      user: { id: "1", name: "김학생", email: "student@univ.ac.kr" },
    };
  },
  async uploadPdf(_title, _pdf) {
    await delay(600);
    return { lecture_id: 1, total_pages: 24 };
  },
  async uploadAudio(_lectureId, _audio) {
    await delay(400);
    return { audio_id: 1 };
  },
  async uploadBoard(_lectureId, _image) {
    await delay(400);
    return { board_image_id: 1 };
  },
  async startAnalysis(_lectureId) {
    await delay(300);
    const jobId = "mock-job-" + Date.now();
    jobStart.set(jobId, Date.now());
    return { job_id: jobId };
  },
  async getJob(jobId) {
    let start = jobStart.get(jobId);
    if (start === undefined) {
      start = Date.now();
      jobStart.set(jobId, start);
    }
    const elapsed = Date.now() - start;
    const progress = Math.min(100, Math.round(elapsed / 150)); // 약 15초에 완료
    const done = progress >= 100;
    const idx = Math.min(MOCK_STATUSES.length - 1, Math.floor(progress / (100 / MOCK_STATUSES.length)));
    return {
      job_id: jobId,
      status: done ? "완료" : MOCK_STATUSES[idx],
      progress,
      ...(done ? { lecture_id: "1" } : {}),
    };
  },
  async getLectures() {
    await delay(300);
    return MOCK_LECTURES.map(l => ({ ...l, slides: [] }));
  },
  async getLectureSlides(lectureId) {
    await delay(300);
    return MOCK_LECTURES.find(l => l.id === lectureId) ?? MOCK_LECTURES[0];
  },
  async translateSlide(slideId, targetLanguage) {
    await delay(500);
    return {
      slide_id: slideId,
      target_language: targetLanguage,
      translated_text: `[${targetLanguage}] 번역된 슬라이드 내용 (mock)`,
    };
  },
};
