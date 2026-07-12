import { describe, it, expect } from "vitest";
import { resultDictToStudyData } from "./studyAdapter";
import { SAMPLE_RESULT } from "./__fixtures__/resultDict.sample";
import type { ResultDict } from "../api";

describe("resultDictToStudyData", () => {
  const sd = resultDictToStudyData(SAMPLE_RESULT, "lec-1");

  it("lectureId·courseName·overall 매핑", () => {
    expect(sd.lectureId).toBe("lec-1");
    expect(sd.courseName).toBe("정보보호이론");
    expect(sd.overall).toBe(SAMPLE_RESULT.lecture_summary);
  });

  it("챕터: summary_note → noteMd 그대로 (인용 마커 보존)", () => {
    expect(sd.chapters).toHaveLength(2);
    expect(sd.chapters[0].noteMd).toBe(SAMPLE_RESULT.chapters[0].summary_note);
    expect(sd.chapters[0].noteMd).toContain("[s:1]"); // 렌더러 remarkCitations가 파싱할 마커
    expect(sd.chapters[0].slides).toEqual([1, 2]);
    expect(sd.chapters[0].idx).toBe(0);
    expect(sd.chapters[0].chapterNumber).toBe(1); // BE chapter_number (on-demand 호출용)
    expect(sd.chapters[1].chapterNumber).toBe(2);
    expect(sd.chapters[1].pages).toBe("3~3페이지");
  });

  it("슬라이드: transcript_segments로 타임라인 구성", () => {
    expect(sd.slides).toHaveLength(3);
    expect(sd.slides[0].n).toBe(1);
    expect(sd.slides[0].startSec).toBe(0);
    expect(sd.slides[0].endSec).toBe(24); // 두 segment의 max end
    expect(sd.durationSec).toBe(60); // 전체 최대 end
  });

  it("스크립트: 모든 segment → ScriptSentence (시간순)", () => {
    expect(sd.script).toHaveLength(4); // 2 + 1 + 1
    expect(sd.script[0]).toMatchObject({ slide: 1, t: 0 });
    expect(sd.script.every((s, i, a) => i === 0 || a[i - 1].t <= s.t)).toBe(true);
  });

  it("판서: blackboard.image_urls → Photo", () => {
    expect(sd.photos).toHaveLength(1);
    expect(sd.photos[0]).toMatchObject({ slide: 2, img: "https://cdn.example.com/board/s2-a.png" });
  });

  it("번역 탭은 on-demand라 비어 있음", () => {
    expect(sd.chaptersEn).toEqual([]);
    expect(sd.overallEn).toBe("");
  });

  it("오디오 유무: transcript_segments 있으면 hasAudio true (BUG2)", () => {
    expect(sd.hasAudio).toBe(true);
  });

  it("오디오 유무: segment 전무면 hasAudio false → 문서 모드 (BUG2)", () => {
    const noAudio: ResultDict = {
      ...SAMPLE_RESULT,
      slides: SAMPLE_RESULT.slides.map((s) => ({ ...s, transcript_segments: [] })),
    };
    expect(resultDictToStudyData(noAudio, "x").hasAudio).toBe(false);
  });
});
