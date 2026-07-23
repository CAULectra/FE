import { describe, it, expect } from "vitest";
import { mockApi } from "./mock";

// 리뷰 #43 — mock deleteLecture가 목록에서 "실제로" 제거하는지 고정.
// (과거엔 no-op이라 목 기반 테스트에서 삭제 후에도 목록에 남는 함정이 있었음)
describe("mockApi.deleteLecture", () => {
  it("삭제한 강의는 이후 getLectures 결과에서 빠진다", async () => {
    const before = await mockApi.getLectures();
    expect(before.map((l) => l.id)).toContain("mock-lec-1");

    await mockApi.deleteLecture("mock-lec-1");

    const after = await mockApi.getLectures();
    expect(after.map((l) => l.id)).not.toContain("mock-lec-1");
    expect(after).toHaveLength(before.length - 1);
  });

  it("없는 id 삭제는 목록을 건드리지 않는다 (BE DELETE 멱등성과 동일)", async () => {
    const before = await mockApi.getLectures();
    await mockApi.deleteLecture("no-such-id");
    const after = await mockApi.getLectures();
    expect(after).toEqual(before);
  });
});
