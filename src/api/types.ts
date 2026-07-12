// ─── API 타입 (배포된 lectra_BE 실제 계약 기준) ───────────────────────────────
//   출처: api.lectranote.com/openapi.json + FE↔BE 통합 가이드 문서.
//   ⚠️ id는 전부 UUID 문자열(number 아님). status는 한글 문자열.

/** 백엔드 job/lecture status (한글). 목록·상세·job 공통. */
export type BackendStatus =
  | "대기" | "처리중" | "추출" | "매핑" | "챕터" | "요약" | "인덱싱" | "완료" | "실패";

// ── 인증 ──────────────────────────────────────────────────────────
export interface LoginUser {
  id?: string;                    // 백엔드 UserOut.id 는 문자열(UUID)
  name?: string;
  email?: string;
  profile_image?: string | null;
}
// POST /auth/login/google → { access_token, token_type: "Bearer", user }
export interface LoginResponse {
  access_token: string;
  token_type?: string;
  user?: LoginUser;
}

// ── 업로드 ────────────────────────────────────────────────────────
export interface UploadPdfResponse { lecture_id: string; }   // POST /upload-pdf
export interface OkResponse { ok: true; }                    // POST .../upload-audio
export interface UploadBoardResponse { board_count: number; } // POST .../upload-board
// POST /lectures/{id}/process
export interface ProcessResponse { job_id: string; status: BackendStatus; }

// ── 조회 ──────────────────────────────────────────────────────────
// GET /lectures — 강의당 job status 1개. slides·progress·folderId 등은 없음(§6).
export interface LectureListItem {
  id: string;
  title: string;
  status: BackendStatus | null;
  created_at: string;             // ISO8601
  folder_id?: string | null;      // §4 — 폴더 (null=미분류)
  folder_name?: string | null;    // §4 — 폴더 이름
  // (#6에서 progress/step_index/photo_count/slide_count/audio_sec 확장 예정)
}

// GET /jobs/{job_id}
export interface JobProgress {
  job_id: string;
  status: BackendStatus;
  progress: number;               // 0~100
  lecture_id: string;
}

// GET /lectures/{id}  ==  GET /lectures/{id}/slides (alias)
export interface LectureDetail {
  status: BackendStatus | null;
  error: string | null;
  result: ResultDict | null;      // status==="완료"일 때만 채워짐
  pdf_url?: string | null;        // 원본 PDF presigned(1h). null=없음
}

// result_dict (부록 A) — 노트/스터디 화면이 소비
export interface ResultTranscriptSegment { start: number; end: number; text: string; }
export interface ResultBlackboard { image_urls: string[]; ocr_text: string; }
export interface ResultSlide {
  slide_number: number;
  title: string;
  key_point: string;
  slide_text: string;
  slide_tables_formulas: string;
  blackboard: ResultBlackboard | null;   // 판서 없으면 null
  transcript_segments: ResultTranscriptSegment[];
  summary: string | null;                // on-demand 미생성=null
}
export interface ResultChapter {
  chapter_number: number;
  title: string;
  start_slide: number;
  end_slide: number;
  summary_note: string;
  summary_explain: string | null;        // on-demand 미생성=null
}
export interface ResultDict {
  job_id: string;
  status: BackendStatus;
  lecture_title: string;
  total_slides: number;
  lecture_summary: string;
  chapters: ResultChapter[];
  slides: ResultSlide[];
  rag_index_id: string;
}

// ── on-demand 번역/요약 ───────────────────────────────────────────
// POST /lectures/{id}/slides/{n}/translate
export interface TranslateResponse {
  slide_number: number;
  target_language: string;
  translated_text: string;
}
// POST /lectures/{id}/slides/{n}/summary
export interface SlideSummaryResponse { slide_number: number; summary: string; }
// POST /lectures/{id}/chapters/{n}/summary-explain
export interface ChapterSummaryExplainResponse { chapter_number: number; summary_explain: string; }

// ── RAG Q&A ───────────────────────────────────────────────────────
// POST /lectures/{id}/qa 의 sources[] 항목
export interface QASource {
  slide_number: number;
  title: string;
  score: number;
  chunk_text: string;
}
// POST /lectures/{id}/qa 응답
export interface QAResponse {
  question: string;
  answer: string;
  sources: QASource[];
}

// ── 공통 인터페이스 (mock/real 동일 구현) ─────────────────────────
export interface LectraApi {
  loginGoogle(code: string): Promise<LoginResponse>;
  // 업로드 (부록 B 순서: pdf → audio → (board) → process)
  uploadPdf(title: string, pdf: File): Promise<UploadPdfResponse>;
  uploadAudio(lectureId: string, audio: File): Promise<OkResponse>;
  uploadBoard(lectureId: string, images: File[]): Promise<UploadBoardResponse>; // 배치(복수)
  process(lectureId: string): Promise<ProcessResponse>;
  // 조회
  getJob(jobId: string): Promise<JobProgress>;
  getLectures(): Promise<LectureListItem[]>;
  getLecture(lectureId: string): Promise<LectureDetail>;
  // on-demand
  translateSlide(lectureId: string, slideNumber: number, targetLanguage: string): Promise<TranslateResponse>;
  slideSummary(lectureId: string, slideNumber: number): Promise<SlideSummaryResponse>;
  chapterSummaryExplain(lectureId: string, chapterNumber: number): Promise<ChapterSummaryExplainResponse>;
  // ── RAG Q&A ──
  qa(lectureId: string, question: string, topK?: number): Promise<QAResponse>;
}
