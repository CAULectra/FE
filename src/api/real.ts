// ─── 실제 백엔드 호출 구현 (api.lectranote.com 계약 기준) ──────────────────────
//   경로·폼 필드·시그니처는 배포된 OpenAPI + 통합 가이드에 맞춤.

import { apiGet, apiPostForm, apiPostJson, apiPatchJson, apiDelete } from "./client";
import type {
  LectraApi,
  LoginResponse,
  TokenPairResponse,
  LoginUser,
  UploadPdfResponse,
  OkResponse,
  UploadBoardResponse,
  ProcessResponse,
  JobProgress,
  LectureListItem,
  LectureDetail,
  FolderResponse,
  TranslateResponse,
  SlideSummaryResponse,
  ChapterSummaryExplainResponse,
  QAResponse,
} from "./types";

export const realApi: LectraApi = {
  // POST /auth/login/google  (body: { code }) → access+refresh+user. 로그인 401은 자동갱신 대상 아님.
  loginGoogle(code) {
    return apiPostJson<LoginResponse>("/auth/login/google", { code }, { skipRefresh: true });
  },
  // POST /auth/refresh → 새 access+refresh (로테이션). 자동갱신 대상 아님(무한루프 방지).
  refresh(refreshToken) {
    return apiPostJson<TokenPairResponse>("/auth/refresh", { refresh_token: refreshToken }, { skipRefresh: true });
  },
  // POST /auth/logout → refresh 토큰 서버 폐기(204).
  logout(refreshToken) {
    return apiPostJson<void>("/auth/logout", { refresh_token: refreshToken }, { skipRefresh: true });
  },
  // GET /auth/me → plan 포함 최신 유저(#34)
  getMe() {
    return apiGet<LoginUser>("/auth/me");
  },

  // POST /upload-pdf  (multipart: title, file)  — 폼 필드 "file"
  uploadPdf(title, pdf, folderId) {
    const form = new FormData();
    form.append("title", title);
    form.append("file", pdf);
    if (folderId) form.append("folder_id", folderId); // 실 폴더 id만 (미분류/빈값은 호출부에서 undefined) — #9
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

  // ── 폴더 CRUD (§4) ──
  listFolders() {
    return apiGet<FolderResponse[]>("/folders");
  },
  createFolder(name) {
    return apiPostJson<FolderResponse>("/folders", { name });
  },
  renameFolder(folderId, name) {
    return apiPatchJson<FolderResponse>(`/folders/${folderId}`, { name });
  },
  deleteFolder(folderId) {
    return apiDelete(`/folders/${folderId}`);
  },
  updateLectureFolder(lectureId, folderId) {
    return apiPatchJson<{ lecture_id: string; folder_id: string | null }>(
      `/lectures/${lectureId}`, { folder_id: folderId },
    );
  },
  // DELETE /lectures/{id} — 소프트 삭제(휴지통 이동, 204). 복구는 POST .../restore(후속 UI).
  deleteLecture(lectureId) {
    return apiDelete(`/lectures/${lectureId}`);
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
