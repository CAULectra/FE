/* ================================================================
   Timeline — 하단 전폭 정렬 타임라인 (와이어프레임 E 영역)
   세그먼트 = 슬라이드 구간 · ▼ 사진 · ▬ 형광펜 · 클릭=점프 · 드래그=스크럽
   ================================================================ */
import { useRef } from "react";
import { Pause, Play } from "lucide-react";
import type { Photo, Slide } from "../types";
import { fmtTime } from "../types";
import type { Playback } from "./playback";

/** 형광펜 마커 목업 — 실연동 시 사용자 하이라이트 저장값 */
const HIGHLIGHT_MARKS = [1400, 1540];

export default function Timeline({ slides, photos, pb }: { slides: Slide[]; photos: Photo[]; pb: Playback }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const timeAt = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return pb.currentTime;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * pb.duration;
  };

  const pct = (t: number) => `${(t / pb.duration) * 100}%`;

  return (
    <div className="shrink-0 border-t border-border bg-[#17130F] px-5 pb-2.5 pt-3 text-white">
      <div className="flex items-center gap-4">
        {/* 재생 컨트롤 */}
        <button
          onClick={pb.toggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105"
        >
          {pb.playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
        </button>
        <span className="shrink-0 text-[12.5px] font-medium tabular-nums text-white/85">
          {fmtTime(pb.currentTime)} <span className="text-white/40">/ {fmtTime(pb.duration)}</span>
        </span>
        <button
          onClick={pb.cycleSpeed}
          className="shrink-0 rounded-full border border-white/25 px-2 py-0.5 text-[11px] font-semibold text-white/80 hover:bg-white/10"
        >
          {pb.speed}×
        </button>

        {/* 트랙 */}
        <div
          ref={trackRef}
          className="relative flex-1 cursor-pointer select-none py-3"
          onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); pb.seek(timeAt(e.clientX)); }}
          onPointerMove={(e) => { if (dragging.current) pb.seek(timeAt(e.clientX)); }}
          onPointerUp={() => { dragging.current = false; }}
        >
          {/* 사진 마커 ▼ (트랙 위) */}
          {photos.filter((p) => p.t != null).map((p) => (
            <span
              key={p.id}
              className="absolute -top-0.5 -translate-x-1/2 text-[9px] text-[var(--ember)]"
              style={{ left: pct(p.t!) }}
              title={`사진 · S${p.slide} · ${fmtTime(p.t!)}`}
            >
              ▼
            </span>
          ))}

          {/* 세그먼트 */}
          <div className="flex h-3.5 items-stretch gap-[2px]">
            {slides.map((s) => {
              const w = ((s.endSec - s.startSec) / pb.duration) * 100;
              const active = s.n === pb.activeSlideN;
              const done = pb.currentTime >= s.endSec;
              return (
                <div
                  key={s.n}
                  className="tl-seg relative rounded-[3px]"
                  style={{
                    width: `${w}%`,
                    background: active ? "var(--ember)" : done ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.16)",
                  }}
                  title={`S${s.n} · ${s.title} (${fmtTime(s.startSec)}–${fmtTime(s.endSec)})`}
                >
                  {active && (
                    <span className="absolute -top-[22px] left-1/2 -translate-x-1/2 rounded bg-[var(--ember)] px-1.5 py-0.5 text-[9.5px] font-bold text-black">
                      S{s.n}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 형광펜 마커 ▬ (트랙 아래) */}
          {HIGHLIGHT_MARKS.map((t) => (
            <span key={t} className="absolute -bottom-0.5 h-[3px] w-3 -translate-x-1/2 rounded-full bg-[#FDE68A]" style={{ left: pct(t) }} title={`형광펜 · ${fmtTime(t)}`} />
          ))}

          {/* 플레이헤드 */}
          <div className="pointer-events-none absolute bottom-1.5 top-1.5 w-0.5 rounded bg-white" style={{ left: pct(pb.currentTime) }}>
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white" />
          </div>
        </div>
      </div>
      <p className="mt-1 text-center text-[10px] text-white/35">
        클릭 = 점프 · 드래그 = 스크럽 · ▼ 사진 · ▬ 형광펜 · 세그먼트 호버 시 슬라이드 툴팁
      </p>
    </div>
  );
}
