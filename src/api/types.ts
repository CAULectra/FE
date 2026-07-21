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
  plan?: "admin" | "beta" | "blocked";   // 베타 접근 게이트(#34). 미제공(BE 미배포) = 제한 없음 취급
}
// POST /auth/login/google → { access_token, refresh_token, token_type: "Bearer", user }
export interface LoginResponse {
  access_token: string;
  refresh_token: string;          // PR#77 — refresh 토큰 회전용
  token_type?: string;
  user?: LoginUser;
}
// POST /auth/refresh → 새 access+refresh 쌍(로테이션). 기존 refresh는 무효화됨.
export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
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
  // §6 — BE list_lectures_for_user가 status에서 유도/집계해 제공
  progress?: number;              // 0~100 (status 유도)
  step_index?: number;            // 0~5 (status 유도)
  photo_count?: number;           // 판서 이미지 수
  audio_sec?: number | null;      // 녹음 길이(초). >0 이면 오디오 있음
  slide_count?: number | null;    // total_slides
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
/** 노트 문장 단위 인용(발화 시점 포함) — summarize.py extract_inline_citations 산출 */
export interface NoteCitation {
  block_index: number;
  char_offset: number;
  slide_number: number;
  time_start: number | null;             // 해당 근거 발화의 시작 초(없으면 null)
}
export interface ResultChapter {
  chapter_number: number;
  title: string;
  start_slide: number;
  end_slide: number;
  summary_note: string;
  summary_explain: string | null;        // on-demand 미생성=null
  summary_note_citations?: NoteCitation[] | null;      // NOTE_V2 — 인용칩 정밀 점프용
  summary_note_blocks?: { markdown: string }[] | null; // NOTE_V2 — 블록 단위 마크다운(=summary_note의 원천)
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

// ── 폴더 (§4) ─────────────────────────────────────────────────────
// GET /folders → FolderResponse[]; POST/PATCH → FolderResponse; DELETE → 204
export interface FolderResponse {
  id: string;
  name: string;
  created_at?: string;
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
  refresh(refreshToken: string): Promise<TokenPairResponse>;  // POST /auth/refresh (PR#77)
  logout(refreshToken: string): Promise<void>;                // POST /auth/logout — 서버 폐기(204)
  getMe(): Promise<LoginUser>;   // GET /auth/me — plan 등 최신 유저 상태(#34)
  // 업로드 (부록 B 순서: pdf → audio → (board) → process)
  uploadPdf(title: string, pdf: File, folderId?: string | null): Promise<UploadPdfResponse>;
  uploadAudio(lectureId: string, audio: File): Promise<OkResponse>;
  uploadBoard(lectureId: string, images: File[]): Promise<UploadBoardResponse>; // 배치(복수)
  process(lectureId: string): Promise<ProcessResponse>;
  // 조회
  getJob(jobId: string): Promise<JobProgress>;
  getLectures(): Promise<LectureListItem[]>;
  getLecture(lectureId: string): Promise<LectureDetail>;
  // 폴더 CRUD (§4)
  listFolders(): Promise<FolderResponse[]>;
  createFolder(name: string): Promise<FolderResponse>;
  renameFolder(folderId: string, name: string): Promise<FolderResponse>;
  deleteFolder(folderId: string): Promise<void>;
  // 강의 폴더 이동 (PATCH /lectures/{id}) — folderId=null 이면 미분류로
  updateLectureFolder(lectureId: string, folderId: string | null): Promise<{ lecture_id: string; folder_id: string | null }>;
  // on-demand
  translateSlide(lectureId: string, slideNumber: number, targetLanguage: string): Promise<TranslateResponse>;
  slideSummary(lectureId: string, slideNumber: number): Promise<SlideSummaryResponse>;
  chapterSummaryExplain(lectureId: string, chapterNumber: number): Promise<ChapterSummaryExplainResponse>;
  // ── RAG Q&A ──
  qa(lectureId: string, question: string, topK?: number): Promise<QAResponse>;
}
