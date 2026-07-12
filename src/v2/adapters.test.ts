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
