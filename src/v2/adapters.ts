/* ================================================================
   adapters — BE 응답을 v2 화면 모델로 변환하는 단일 지점
   BE 계약이 바뀌어도 UI 컴포넌트는 손대지 않도록 여기서 흡수한다.
   - 폴더 기능 미정 → folderId 는 단일 기본값 "all"
   - 목록 응답엔 progress·slideCount·hasAudio 등이 없음 → 기본값/status 유도
   ================================================================ */
import type { BackendStatus, LectureListItem } from "../api";
import type { Folder, Lecture, LectureStatus } from "./types";

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

// BE가 status에서 유도하는 진행률(%). GET /jobs/{id}가 progress를 안 줄 때의 폴백.
//   출처: lectra_BE lectures.py _PROGRESS (⚠ BE 임시값 — 나중에 실측 조정 가능)
export const BE_PROGRESS: Record<BackendStatus, number> = {
  대기: 0, 처리중: 5, 추출: 15, 매핑: 40, 챕터: 55, 요약: 75, 인덱싱: 90, 완료: 100, 실패: 0,
};

// 트리클 상한 — 현재 단계에서 "다음 단계 값 -1"까지만 스멀스멀 채운다.
//   폴링 사이 정지 구간에도 진행바가 살짝 움직이되, 다음 단계에 실제 도달 전엔 넘지 않음.
export const TRICKLE_CAP: Record<BackendStatus, number> = {
  대기: 4, 처리중: 14, 추출: 39, 매핑: 54, 챕터: 74, 요약: 89, 인덱싱: 99, 완료: 100, 실패: 0,
};

export interface JobPatch {
  status: LectureStatus;
  progress: number;      // 0~100 (BE 실측 = 이 단계의 바닥값)
  cap: number;           // 트리클 상한 (다음 단계 직전)
  stepIndex: number;     // 0~5
  failedStep?: number;   // status==="failed"일 때 실패 단계
}

/** GET /jobs/{id} 또는 process()의 status → v2 진행 상태 패치.
 *  progress가 없으면 status→BE_PROGRESS로 유도(대기0·처리중5·추출15·매핑40·챕터55·요약75·인덱싱90·완료100). */
export function jobToPatch(job: { status: BackendStatus; progress?: number }): JobPatch {
  const status: LectureStatus = STATUS_MAP[job.status] ?? "processing";
  const stepIndex = STEP_MAP[job.status] ?? 0;
  const progress = typeof job.progress === "number" ? job.progress : BE_PROGRESS[job.status] ?? 0;
  const cap = Math.max(progress, TRICKLE_CAP[job.status] ?? progress);
  const patch: JobPatch = { status, progress, cap, stepIndex };
  if (status === "failed") patch.failedStep = stepIndex;
  return patch;
}

function labelOf(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** GET /lectures 항목 → v2 Lecture. status null(업로드만 됨) → uploaded(처리 전) 취급.
 *  미지의 status 문자열은 processing으로 폴백해 목록 렌더가 죽지 않게 방어(이슈 #10). */
export function lectureFromListItem(item: LectureListItem): Lecture {
  const be = item.status;
  const status: LectureStatus = be ? STATUS_MAP[be] ?? "processing" : "uploaded";
  const stepIndex = be ? STEP_MAP[be] ?? 0 : 0;
  const created = item.created_at ?? "";
  return {
    id: item.id,
    title: item.title,
    folderId: item.folder_id ?? UNCATEGORIZED_FOLDER_ID,
    folderName: item.folder_name ?? undefined,
    uploadedAt: created ? created.slice(0, 10) : "",
    updatedLabel: labelOf(created),
    status,
    progress: status === "ready" ? 100 : 0, // 목록엔 progress 없음 → 상세/job에서 보강
    stepIndex,
    hasAudio: false,                          // 목록엔 없음 → 기본 false
  };
}

/** 폴더 미지정(folder_id=null) 강의가 담기는 '미분류' 버킷 id */
export const UNCATEGORIZED_FOLDER_ID = "__uncat__";

/** 라이브러리 폴더 그리드용 — known 폴더 + 강의가 실제 참조하는 폴더(미분류 포함)를 합쳐
 *  어떤 강의도 어느 폴더 카드에도 안 걸리는 orphan(=빈 화면, 이슈 #10)이 없게 한다. */
export function deriveFolders(lectures: Lecture[], known: Folder[]): Folder[] {
  const byId = new Map<string, Folder>(known.map((f) => [f.id, f]));
  for (const l of lectures) {
    if (byId.has(l.folderId)) continue;
    const name = l.folderId === UNCATEGORIZED_FOLDER_ID ? "미분류" : (l.folderName ?? "폴더");
    byId.set(l.folderId, { id: l.folderId, name });
  }
  return [...byId.values()];
}
