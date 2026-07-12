// ─── 실제 백엔드 호출 구현 (api.lectranote.com 계약 기준) ──────────────────────
//   경로·폼 필드·시그니처는 배포된 OpenAPI + 통합 가이드에 맞춤.

import { apiGet, apiPostForm, apiPostJson } from "./client";
import type {
  LectraApi,
  LoginResponse,
  UploadPdfResponse,
  OkResponse,
  UploadBoardResponse,
  ProcessResponse,
  JobProgress,
  LectureListItem,
  LectureDetail,
  TranslateResponse,
  SlideSummaryResponse,
  ChapterSummaryExplainResponse,
  QAResponse,
} from "./types";

export const realApi: LectraApi = {
  // POST /auth/login/google  (body: { code }) → JWT + 사용자 정보
  loginGoogle(code) {
    return apiPostJson<LoginResponse>("/auth/login/google", { code });
  },

  // POST /upload-pdf  (multipart: title, file)  — 폼 필드 "file"
  uploadPdf(title, pdf) {
    const form = new FormData();
    form.append("title", title);
    form.append("file", pdf);
    return apiPostForm<UploadPdfResponse>("/upload-pdf", form);
  },

  // POST /lectures/{id}/upload-audio  (multipart: file)
  uploadAudio(lectureId, audio) {
    const form = new FormData();
    form.append("file", audio);
    return apiPostForm<OkResponse>(`/lectures/${lectureId}/upload-audio`, form);
  },

  // POST /lectures/{id}/upload-board  (multipart: files[] — 여러 장 배치)
  uploadBoard(lectureId, images) {
    const form = new FormData();
    images.forEach((f) => form.append("files", f));
    return apiPostForm<UploadBoardResponse>(`/lectures/${lectureId}/upload-board`, form);
  },

  // POST /lectures/{id}/process  → { job_id, status }
  process(lectureId) {
    return apiPostJson<ProcessResponse>(`/lectures/${lectureId}/process`, {});
  },

  // GET /jobs/{job_id}
  getJob(jobId) {
    return apiGet<JobProgress>(`/jobs/${jobId}`);
  },

  // GET /lectures
  getLectures() {
    return apiGet<LectureListItem[]>("/lectures");
  },

  // GET /lectures/{id}  (상세 — result_dict 포함)
  getLecture(lectureId) {
    return apiGet<LectureDetail>(`/lectures/${lectureId}`);
  },

  // POST /lectures/{id}/slides/{n}/translate  (body: { target_language })
  translateSlide(lectureId, slideNumber, targetLanguage) {
    return apiPostJson<TranslateResponse>(
      `/lectures/${lectureId}/slides/${slideNumber}/translate`,
      { target_language: targetLanguage },
    );
  },

  // POST /lectures/{id}/slides/{n}/summary
  slideSummary(lectureId, slideNumber) {
    return apiPostJson<SlideSummaryResponse>(
      `/lectures/${lectureId}/slides/${slideNumber}/summary`, {},
    );
  },

  // POST /lectures/{id}/chapters/{n}/summary-explain
  chapterSummaryExplain(lectureId, chapterNumber) {
    return apiPostJson<ChapterSummaryExplainResponse>(
      `/lectures/${lectureId}/chapters/${chapterNumber}/summary-explain`, {},
    );
  },
  qa(lectureId, question, topK = 5) {
    return apiPostJson<QAResponse>(`/lectures/${lectureId}/qa`, { question, top_k: topK });
  },
};
