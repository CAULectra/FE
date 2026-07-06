// ─── 실제 백엔드 호출 구현 (명세 기준) ────────────────────────────────────────

import { apiGet, apiPostForm, apiPostJson } from "./client";
import type {
  Lecture,
  LectraApi,
  LoginResponse,
  StartAnalysisResponse,
  TranslateResponse,
  UploadAudioResponse,
  UploadBoardResponse,
  UploadPdfResponse,
  JobProgress,
} from "./types";

export const realApi: LectraApi = {
  // POST /auth/login/google  (body: { code }) → JWT + 사용자 정보
  loginGoogle(code) {
    return apiPostJson<LoginResponse>("/auth/login/google", { code });
  },

  // POST /upload-pdf  (multipart: title, pdf)
  uploadPdf(title, pdf) {
    const form = new FormData();
    form.append("title", title);
    form.append("pdf", pdf);
    return apiPostForm<UploadPdfResponse>("/upload-pdf", form);
  },

  // POST /lectures/{id}/upload-audio  (multipart: audio)
  uploadAudio(lectureId, audio) {
    const form = new FormData();
    form.append("audio", audio);
    return apiPostForm<UploadAudioResponse>(`/lectures/${lectureId}/upload-audio`, form);
  },

  // POST /lectures/{id}/upload-board  (multipart: image)
  uploadBoard(lectureId, image) {
    const form = new FormData();
    form.append("image", image);
    return apiPostForm<UploadBoardResponse>(`/lectures/${lectureId}/upload-board`, form);
  },

  // ⚠️ job_id 출처 미확정. 업로드 응답엔 job_id가 없어, 분석을 시작하고 job_id를
  //    반환하는 엔드포인트가 필요합니다. 백엔드 확정 시 아래 경로/방식을 맞춰주세요.
  startAnalysis(lectureId) {
    return apiPostJson<StartAnalysisResponse>(`/lectures/${lectureId}/analyze`, {});
  },

  // GET /jobs/{job_id}
  getJob(jobId) {
    return apiGet<JobProgress>(`/jobs/${jobId}`);
  },

  // GET /lectures
  getLectures() {
    return apiGet<Lecture[]>("/lectures");
  },

  // GET /lectures/{id}/slides
  getLectureSlides(lectureId) {
    return apiGet<Lecture>(`/lectures/${lectureId}/slides`);
  },

  // POST /slides/{id}/translate  (body: { target_language })
  translateSlide(slideId, targetLanguage) {
    return apiPostJson<TranslateResponse>(`/slides/${slideId}/translate`, {
      target_language: targetLanguage,
    });
  },
};
