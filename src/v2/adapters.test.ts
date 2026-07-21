import { describe, it, expect } from "vitest";
import { lectureFromListItem, deriveFolders, UNCATEGORIZED_FOLDER_ID } from "./adapters";
import type { LectureListItem } from "../api";
import type { Folder, Lecture } from "./types";

const item = (over: Partial<LectureListItem> = {}): LectureListItem => ({
  id: "L1",
  title: "강의",
  status: "완료",
  created_at: "2026-07-11T00:00:00Z",
  ...over,
});

const baseLec: Lecture = {
  id: "L", title: "t", folderId: "f", uploadedAt: "2026-07-11",
  updatedLabel: "Jul 11", status: "ready", progress: 100, stepIndex: 5, hasAudio: false,
};

describe("lectureFromListItem — 이슈 #10 방어", () => {
  it("status null(업로드만 됨) → 'uploaded'(처리 전)", () => {
    expect(lectureFromListItem(item({ status: null })).status).toBe("uploaded");
  });

  it("null status면 progress/stepIndex 0으로 방어", () => {
    const lec = lectureFromListItem(item({ status: null }));
    expect(lec.progress).toBe(0);
    expect(lec.stepIndex).toBe(0);
  });

  it("미지의 status 문자열도 throw 없이 processing 폴백", () => {
    const bad = () => lectureFromListItem(item({ status: "무언가" as unknown as null }));
    expect(bad).not.toThrow();
    expect(bad().status).toBe("processing");
  });

  it("folder_id/folder_name → folderId/folderName 매핑", () => {
    const lec = lectureFromListItem(item({ folder_id: "f_math", folder_name: "이산수학" }));
    expect(lec.folderId).toBe("f_math");
    expect(lec.folderName).toBe("이산수학");
  });

  it("folder_id 없으면 '미분류' 버킷 id", () => {
    expect(lectureFromListItem(item({ folder_id: null })).folderId).toBe(UNCATEGORIZED_FOLDER_ID);
  });

  it("완료 → ready (회귀 가드)", () => {
    expect(lectureFromListItem(item({ status: "완료" })).status).toBe("ready");
  });
});

describe("lectureFromListItem — 최근순 정렬 (BUG3)", () => {
  it("uploadedAt은 정렬용 전체 타임스탬프 보존 (날짜만으로 자르지 않음)", () => {
    expect(lectureFromListItem(item({ created_at: "2026-07-11T09:30:00Z" })).uploadedAt)
      .toBe("2026-07-11T09:30:00Z");
  });

  it("같은 날 업로드도 시각 기준 최신순 정렬 가능", () => {
    const older = lectureFromListItem(item({ id: "a", created_at: "2026-07-11T08:00:00Z" }));
    const newer = lectureFromListItem(item({ id: "b", created_at: "2026-07-11T10:00:00Z" }));
    const sorted = [older, newer].sort((x, y) => y.uploadedAt.localeCompare(x.uploadedAt));
    expect(sorted[0].id).toBe("b"); // 나중에 올린 강의가 위로
  });
});

describe("deriveFolders — orphan 없이 모든 강의 노출", () => {
  const known: Folder[] = [{ id: "f_known", name: "알려진 폴더" }];

  it("known 폴더 포함", () => {
    expect(deriveFolders([], known).some((f) => f.id === "f_known")).toBe(true);
  });

  it("known에 없는 참조 폴더를 folderName으로 추가", () => {
    const out = deriveFolders([{ ...baseLec, folderId: "f_new", folderName: "새 폴더" }], known);
    expect(out.find((f) => f.id === "f_new")?.name).toBe("새 폴더");
  });

  it("미분류 강의 → '미분류' 폴더", () => {
    const out = deriveFolders([{ ...baseLec, folderId: UNCATEGORIZED_FOLDER_ID }], known);
    expect(out.find((f) => f.id === UNCATEGORIZED_FOLDER_ID)?.name).toBe("미분류");
  });

  it("모든 강의 folderId가 결과에 존재 (orphan 0)", () => {
    const lectures: Lecture[] = [
      { ...baseLec, id: "a", folderId: "f_x", folderName: "X" },
      { ...baseLec, id: "b", folderId: UNCATEGORIZED_FOLDER_ID },
    ];
    const ids = new Set(deriveFolders(lectures, known).map((f) => f.id));
    expect(lectures.every((l) => ids.has(l.folderId))).toBe(true);
  });
});

describe("lectureFromListItem — 목록 필드 확장 (#6)", () => {
  it("BE progress/step_index를 그대로 반영 (없으면 status 유도)", () => {
    const lec = lectureFromListItem(item({ status: "매핑", progress: 40, step_index: 3 }));
    expect(lec.progress).toBe(40);
    expect(lec.stepIndex).toBe(3);
  });

  it("audio_sec>0 → hasAudio true, 0/누락 → false", () => {
    expect(lectureFromListItem(item({ audio_sec: 3600 })).hasAudio).toBe(true);
    expect(lectureFromListItem(item({ audio_sec: 0 })).hasAudio).toBe(false);
    expect(lectureFromListItem(item({ audio_sec: null })).hasAudio).toBe(false);
  });

  it("slide_count/photo_count/audio_sec 메타 매핑", () => {
    const lec = lectureFromListItem(item({ slide_count: 42, photo_count: 3, audio_sec: 1800 }));
    expect(lec.slideCount).toBe(42);
    expect(lec.photoCount).toBe(3);
    expect(lec.audioSec).toBe(1800);
  });
});
