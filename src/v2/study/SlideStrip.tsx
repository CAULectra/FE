/* ================================================================
   SlideStrip — 좌측 세로 슬라이드 (재생 따라 자동 스크롤)
   슬라이드 = 실제 PDF 페이지 렌더 이미지 (public/slides/…)
   챕터 구분선 + 체류시간 히트맵(교수/나/기출) + 동기화 상태
   ================================================================ */
import { Fragment, useEffect, useRef } from "react";
import type { Chapter, Slide } from "../types";
import { fmtTime } from "../types";
import type { Playback } from "./playback";

interface Props {
  slides: Slide[];
  chapters: Chapter[];
  pb: Playback;
  docMode: boolean;
}

export default function SlideStrip({ slides, chapters, pb, docMode }: Props) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const maxSeg = Math.max(...slides.map((sl) => sl.endSec - sl.startSec), 1);
  const suppressScrollEvent = useRef(false);

  /* 동기화 ON: 활성 슬라이드로 자동 스크롤 */
  useEffect(() => {
    if (!pb.syncOn || docMode) return;
    suppressScrollEvent.current = true;
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(() => { suppressScrollEvent.current = false; }, 600);
    return () => clearTimeout(t);
  }, [pb.activeSlideN, pb.syncOn, docMode]);

  return (
    <div className="flex h-full w-full flex-col bg-[#FAF8F5]">
      {/* 헤더 */}
      <div className="border-b border-border px-3.5 pb-2 pt-2.5">
        <span className="text-[12px] font-semibold text-card-foreground">슬라이드</span>
        <div className="mt-0.5 text-[10.5px] text-muted-foreground">
          전체 {slides.length}페이지 · {chapters.length}챕터{docMode ? " · 문서 모드" : ""}
        </div>
      </div>

      {/* 동기화 상태 */}
      {!docMode && (
        <div className="flex items-center justify-between px-3.5 py-1.5 text-[10.5px]">
          <span className={pb.syncOn ? "font-semibold text-[#92400E]" : "text-muted-foreground"}>
            {pb.syncOn ? "동기화 ON — 재생 따라옴" : "동기화 일시 해제 (수동 탐색)"}
          </span>
        </div>
      )}

      {/* 슬라이드 목록 (챕터 구분선 포함) */}
      <div
        onWheel={() => { if (!suppressScrollEvent.current && !docMode) pb.breakSync(); }}
        className="ws-scroll flex-1 space-y-2 overflow-y-auto px-3.5 py-2"
      >
        {slides.map((s) => {
          const active = s.n === pb.activeSlideN && !docMode;
          const chapterHere = chapters.find((c) => c.slides[0] === s.n);
          return (
            <Fragment key={s.n}>
              {chapterHere && (
                <div className="flex items-center gap-2 pb-0.5 pt-2 first:pt-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{chapterHere.title}</span>
                  <span className="truncate text-[10px] text-muted-foreground">{chapterHere.sub}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <button
                ref={active ? activeRef : undefined}
                onClick={() => (docMode ? undefined : pb.seek(s.startSec + 0.5))}
                className={`group block w-full overflow-hidden rounded-lg border bg-white text-left transition-all ${
                  active ? "border-primary shadow-[0_0_0_3px_rgba(194,65,12,0.13)]" : "border-border hover:border-primary/40"
                }`}
              >
                {/* 실제 슬라이드 페이지 렌더 */}
                <div className="relative">
                  {s.img ? (
                    <img src={s.img} alt={`S${s.n} — ${s.title}`} loading="lazy" className="block w-full" draggable={false} />
                  ) : (
                    /* 실모드: BE가 슬라이드 렌더 이미지를 안 줌 → 제목 플레이스홀더 */
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#FAF8F5] px-3 text-center">
                      <span className="line-clamp-3 text-[11px] font-medium leading-snug text-muted-foreground">{s.title}</span>
                    </div>
                  )}
                  <span className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9.5px] font-bold ${
                    active ? "bg-primary text-white" : "bg-black/55 text-white"
                  }`}>
                    S{s.n}
                  </span>
                  {active && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-[#17130F]/90 px-2 py-0.5 text-[9.5px] font-semibold text-white">
                      현재 · {fmtTime(pb.currentTime)}
                    </span>
                  )}
                </div>
                {/* 이 슬라이드에서 얘기한 시간 */}
                {!docMode && (
                  <div className="flex items-center gap-1.5 border-t border-[#F1ECE2] px-2 py-1">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#F1ECE2]">
                      <div
                        className="h-full rounded-full bg-[#E3A574]"
                        style={{ width: `${Math.round(((s.endSec - s.startSec) / maxSeg) * 100)}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[9px] tabular-nums text-muted-foreground">
                      {Math.max(1, Math.round((s.endSec - s.startSec) / 60))}분
                    </span>
                  </div>
                )}
              </button>
            </Fragment>
          );
        })}
        <p className="px-1 pb-2 pt-1 text-[10px] leading-relaxed text-muted-foreground/80">
          {docMode
            ? "녹음이 없는 강의 — 정렬 타임라인 비활성. 녹음을 추가하면 정렬·타임라인이 생성됩니다."
            : "휠 스크롤 = 수동 탐색 (동기화 일시 해제 → '재생 위치로' 버튼)"}
        </p>
      </div>
    </div>
  );
}
