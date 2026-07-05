/* ================================================================
   SlideStrip — 좌측 세로 슬라이드 (재생 따라 자동 스크롤)
   히트맵: 바 길이·진하기 = 머문 시간 (소스: 교수/나/기출 토글)
   ================================================================ */
import { useEffect, useRef, useState } from "react";
import type { Slide } from "../types";
import { fmtTime } from "../types";
import type { Playback } from "./playback";

type HeatSource = "off" | "prof" | "me" | "exam";
const HEAT_LABEL: Record<Exclude<HeatSource, "off">, string> = { prof: "교수", me: "나", exam: "기출" };

export default function SlideStrip({ slides, pb, docMode }: { slides: Slide[]; pb: Playback; docMode: boolean }) {
  const [heat, setHeat] = useState<HeatSource>("off");
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const suppressScrollEvent = useRef(false);

  const maxDwell = Math.max(...slides.map((s) => s.dwellProf ?? 0), 1);

  /* 동기화 ON: 활성 슬라이드로 자동 스크롤 */
  useEffect(() => {
    if (!pb.syncOn || docMode) return;
    suppressScrollEvent.current = true;
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(() => { suppressScrollEvent.current = false; }, 600);
    return () => clearTimeout(t);
  }, [pb.activeSlideN, pb.syncOn, docMode]);

  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col border-r border-border bg-[#F7F4F0]">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <span className="text-[12px] font-semibold text-card-foreground">
          {docMode ? "슬라이드 (문서 모드)" : "슬라이드"}
        </span>
        <div className="flex items-center gap-1">
          {(["prof", "me", "exam"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setHeat((h) => (h === k ? "off" : k))}
              className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
                heat === k ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-accent"
              }`}
              title="체류시간 히트맵 — 소스 전환"
            >
              {HEAT_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      {/* 동기화 상태 */}
      {!docMode && (
        <div className="flex items-center justify-between px-3.5 py-1.5 text-[10.5px]">
          <span className={pb.syncOn ? "font-semibold text-[#92400E]" : "text-muted-foreground"}>
            {pb.syncOn ? "동기화 ON — 재생 따라옴" : "동기화 일시 해제 (수동 탐색)"}
          </span>
          {!pb.syncOn && (
            <button onClick={pb.resync} className="rounded-full bg-[var(--ember)] px-2 py-0.5 font-semibold text-white hover:brightness-95">
              재생 위치로
            </button>
          )}
        </div>
      )}

      {/* 슬라이드 목록 */}
      <div
        ref={listRef}
        onWheel={() => { if (!suppressScrollEvent.current && !docMode) pb.breakSync(); }}
        className="ws-scroll flex-1 space-y-2.5 overflow-y-auto px-3.5 py-2"
      >
        {slides.map((s) => {
          const active = s.n === pb.activeSlideN && !docMode;
          const dwell = s.dwellProf ?? 0;
          const isMax = dwell === maxDwell && heat !== "off";
          return (
            <button
              key={s.n}
              ref={active ? activeRef : undefined}
              onClick={() => (docMode ? undefined : pb.seek(s.startSec + 0.5))}
              className={`block w-full rounded-lg border text-left transition-all ${
                active ? "border-primary shadow-[0_0_0_3px_rgba(194,65,12,0.12)]" : "border-border hover:border-primary/40"
              } bg-white`}
            >
              {/* 슬라이드 렌더 플레이스홀더 */}
              <div className="relative rounded-t-lg bg-gradient-to-br from-white to-[#F5F1EA] px-3 pb-8 pt-2.5" style={{ minHeight: s.n === pb.activeSlideN ? 118 : 74 }}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>
                    S{s.n}{s.isBoard ? " · 판서" : ""}
                  </span>
                  {active && (
                    <span className="rounded-full bg-[#17130F] px-2 py-0.5 text-[10px] font-semibold text-white">
                      현재 · {fmtTime(pb.currentTime)}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[12px] font-medium leading-snug text-card-foreground">{s.title}</div>
                {active && (
                  <>
                    <div className="mt-2 h-1.5 w-4/5 rounded bg-[#EDE6DA]" />
                    <div className="mt-1 h-1.5 w-3/5 rounded bg-[#EDE6DA]" />
                    <div className="mt-1 h-1.5 w-2/3 rounded bg-[#F1ECE2]" />
                  </>
                )}
                {/* 히트맵 바 */}
                {heat !== "off" && (
                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFE9DF]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((dwell / maxDwell) * 100)}%`,
                            background: `rgba(194, 65, 12, ${0.25 + 0.75 * (dwell / maxDwell)})`,
                          }}
                        />
                      </div>
                      <span className={`shrink-0 text-[9.5px] tabular-nums ${isMax ? "font-bold text-primary" : "text-muted-foreground"}`}>
                        {Math.round(dwell / 60)}분{isMax ? " ★" : ""}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
        <p className="px-1 pb-2 pt-1 text-[10px] leading-relaxed text-muted-foreground/80">
          {docMode
            ? "녹음이 없는 강의 — 정렬 타임라인 비활성. 녹음을 추가하면 정렬·스크립트·타임라인이 생성됩니다."
            : heat !== "off"
              ? "바 길이·진하기 = 머문 시간. 오래 머문 슬라이드 = 시험 포인트"
              : "휠 스크롤 = 수동 탐색 (동기화 일시 해제 → '재생 위치로' 버튼)"}
        </p>
      </div>
    </div>
  );
}
