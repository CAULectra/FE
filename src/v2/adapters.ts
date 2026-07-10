/* ================================================================
   adapters — BE 응답을 v2 화면 모델로 변환하는 단일 지점
   BE 계약이 바뀌어도 UI 컴포넌트는 손대지 않도록 여기서 흡수한다.
   - 폴더 기능 미정 → folderId 는 단일 기본값 "all"
   - 목록 응답엔 progress·slideCount·hasAudio 등이 없음 → 기본값/status 유도
   ================================================================ */
import type { BackendStatus, LectureListItem } from "../api";
import type { Lecture, LectureStatus } from "./types";

/** 폴더 미정 동안 모든 강의가 속하는 단일 기본 폴더 */
export const DEFAULT_FOLDER_ID = "all";

const STATUS_MAP: Record<BackendStatus, LectureStatus> = {
  대기: "queued",
  처리중: "processing",
  추출: "processing",
  매핑: "processing",
  챕터: "processing",
  요약: "processing",
  인덱싱: "processing",
  완료: "ready",
  실패: "failed",
};

// status → 파이프라인 단계 index(0~5, v2 PIPELINE_STEPS)
const STEP_MAP: Record<BackendStatus, number> = {
  대기: 0, 처리중: 1, 추출: 2, 매핑: 3, 챕터: 4, 요약: 4, 인덱싱: 4, 완료: 5, 실패: 0,
};

function labelOf(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** GET /lectures 항목 → v2 Lecture. status null(업로드만 됨) → queued 취급. */
export function lectureFromListItem(item: LectureListItem): Lecture {
  const be = item.status;
  const status: LectureStatus = be ? STATUS_MAP[be] ?? "processing" : "queued";
  const stepIndex = be ? STEP_MAP[be] ?? 0 : 0;
  const created = item.created_at ?? "";
  return {
    id: item.id,
    title: item.title,
    folderId: DEFAULT_FOLDER_ID,
    uploadedAt: created ? created.slice(0, 10) : "",
    updatedLabel: labelOf(created),
    status,
    progress: status === "ready" ? 100 : 0, // 목록엔 progress 없음 → 상세/job에서 보강
    stepIndex,
    hasAudio: false,                          // 목록엔 없음 → 기본 false
  };
}
