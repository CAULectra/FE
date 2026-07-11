/* ================================================================
   studyAdapter — BE result_dict → v2 StudyData 매핑 (순수 함수)
   백엔드 GET /lectures/{id} 의 result(ResultDict)를 스터디 화면 모델로 변환한다.
   - chapters[].summary_note(마크다운) → Chapter.noteMd (렌더러가 [s:N] 인용까지 파싱)
   - slides[].transcript_segments      → 슬라이드 타임라인 + 녹음 스크립트
   - slides[].blackboard.image_urls    → 판서 사진(Photo)
   - lecture_summary                   → overall
   BE가 안 주는 값(슬라이드 렌더 이미지·챕터별 영어 요약)은 비워둔다.
   ※ 계약 출처: lectra_BE app/pipeline/process.py _build_result_dict
   ================================================================ */
import type { ResultChapter, ResultDict, ResultSlide } from "../api";
import type { Chapter, Photo, ScriptSentence, Slide, StudyData } from "./types";

/** 슬라이드의 정렬 구간 [startSec, endSec) — transcript_segments의 min start / max end. 없으면 0. */
function slideSpan(s: ResultSlide): { startSec: number; endSec: number } {
  const segs = s.transcript_segments ?? [];
  if (segs.length === 0) return { startSec: 0, endSec: 0 };
  let start = Infinity;
  let end = 0;
  for (const seg of segs) {
    if (seg.start < start) start = seg.start;
    if (seg.end > end) end = seg.end;
  }
  return { startSec: Math.round(start === Infinity ? 0 : start), endSec: Math.round(end) };
}

function toSlide(s: ResultSlide): Slide {
  const { startSec, endSec } = slideSpan(s);
  return {
    n: s.slide_number,
    title: s.title || `Slide ${s.slide_number}`,
    startSec,
    endSec,
    // result_dict 엔 슬라이드 렌더 이미지 URL이 없음 → img 생략(UI가 텍스트 폴백)
    isBoard: false,
  };
}

/** 모든 슬라이드의 transcript_segments → 시간순 스크립트 문장. */
function toScript(slides: ResultSlide[]): ScriptSentence[] {
  const out: ScriptSentence[] = [];
  for (const s of slides) {
    (s.transcript_segments ?? []).forEach((seg, i) => {
      const text = (seg.text ?? "").trim();
      if (!text) return;
      out.push({ id: `sc_${s.slide_number}_${i}`, slide: s.slide_number, t: Math.round(seg.start), text });
    });
  }
  return out.sort((a, b) => a.t - b.t);
}

/** 판서(blackboard) 이미지 → Photo. 슬라이드 시작 시점에 앵커. */
function toPhotos(slides: ResultSlide[]): Photo[] {
  const out: Photo[] = [];
  for (const s of slides) {
    const urls = s.blackboard?.image_urls ?? [];
    urls.forEach((img, i) => {
      out.push({
        id: `ph_${s.slide_number}_${i}`,
        slide: s.slide_number,
        t: slideSpan(s).startSec || undefined,
        label: `판서 — ${s.title || `S${s.slide_number}`}`,
        img,
      });
    });
  }
  return out;
}

function toChapter(c: ResultChapter, i: number, slides: ResultSlide[]): Chapter {
  const count = Math.max(0, c.end_slide - c.start_slide + 1);
  const hasBoard = slides.some(
    (s) => s.slide_number >= c.start_slide && s.slide_number <= c.end_slide && (s.blackboard?.image_urls?.length ?? 0) > 0,
  );
  const meta = [`슬라이드 ${count}장`, hasBoard ? "판서 포함" : null].filter(Boolean).join(" · ");
  return {
    idx: i,                          // 배열 위치 = v2 idx (BE numbering과 무관하게 안전)
    chapterNumber: c.chapter_number, // on-demand summary-explain 호출용
    title: `Chapter ${c.chapter_number}`,
    sub: c.title,
    pages: `${c.start_slide}~${c.end_slide}페이지`,
    slides: [c.start_slide, c.end_slide],
    intro: "",                       // 실데이터는 summary_note가 본문 → intro 비움
    meta,
    summary: [],                     // noteMd 있으면 NotePane이 마크다운 경로로 렌더
    blocks: [],
    noteMd: c.summary_note ?? "",    // ★ 핵심: 백엔드 마크다운 노트
  };
}

/** 강의 전체 길이(초) — 모든 segment의 최대 end. */
function totalDuration(slides: ResultSlide[]): number {
  let end = 0;
  for (const s of slides) for (const seg of s.transcript_segments ?? []) if (seg.end > end) end = seg.end;
  return Math.round(end);
}

/** BE result_dict → v2 StudyData. lectureId는 라우팅용 강의 id. */
export function resultDictToStudyData(result: ResultDict, lectureId: string): StudyData {
  const slides = result.slides ?? [];
  const defaultSlide =
    slides.find((s) => (s.transcript_segments?.length ?? 0) > 0)?.slide_number ?? slides[0]?.slide_number ?? 1;
  return {
    lectureId,
    courseName: result.lecture_title || "강의",
    defaultSlide,
    durationSec: totalDuration(slides),
    slides: slides.map(toSlide),
    script: toScript(slides),
    chapters: (result.chapters ?? []).map((c, i) => toChapter(c, i, slides)),
    photos: toPhotos(slides),
    overall: result.lecture_summary ?? "",
    chaptersEn: [],   // 번역은 on-demand(translateSlide) — 여기선 빈 값
    overallEn: "",
  };
}
