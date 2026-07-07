// ─── API 타입 (백엔드 명세 기준) ──────────────────────────────────────────────

export interface Slide {
  id: number;
  page_num: number;
  image_path: string;
  text_content: string;
  ocr_text: string;
}

export interface Lecture {
  id: number;
  title: string;
  pdf_path?: string;
  created_at?: string;
  slides: Slide[];
}

export interface UploadPdfResponse {
  lecture_id: number;
  total_pages: number;
}

export interface UploadAudioResponse {
  audio_id: number;
}

export interface UploadBoardResponse {
  board_image_id: number;
}

export interface TranslateResponse {
  slide_id: number;
  target_language: string;
  translated_text: string;
}

// GET /jobs/{job_id} — status는 한글 문자열("매핑중", "완료" 등), progress는 0~100
export interface JobProgress {
  job_id: string;
  status: string;
  progress: number;
  lecture_id?: string; // 완료 시 포함
}

// ⚠️ job_id 출처 미확정: 업로드 응답에 job_id가 없어, 분석을 시작하고 job_id를
//    받는 별도 엔드포인트가 필요합니다. 백엔드 확인 후 real.ts의 startAnalysis 조정 요망.
export interface StartAnalysisResponse {
  job_id: string;
}

export interface LoginUser {
  id?: number;
  name?: string;
  email?: string;
  profile_image?: string;
}

// POST /auth/login/google — 확정 응답 형태
//   { access_token, token_type: "Bearer", user: { id, email, name, profile_image } }
export interface LoginResponse {
  access_token: string;
  token_type?: string;
  user?: LoginUser;
}

// 목/실제 구현이 모두 만족해야 하는 공통 인터페이스
export interface LectraApi {
  loginGoogle(code: string): Promise<LoginResponse>;
  uploadPdf(title: string, pdf: File): Promise<UploadPdfResponse>;
  uploadAudio(lectureId: number, audio: File): Promise<UploadAudioResponse>;
  uploadBoard(lectureId: number, image: File): Promise<UploadBoardResponse>;
  startAnalysis(lectureId: number): Promise<StartAnalysisResponse>;
  getJob(jobId: string): Promise<JobProgress>;
  getLectures(): Promise<Lecture[]>;
  getLectureSlides(lectureId: number): Promise<Lecture>;
  translateSlide(slideId: number, targetLanguage: string): Promise<TranslateResponse>;
}
