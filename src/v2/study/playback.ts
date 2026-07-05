/* ================================================================
   usePlayback — Study 동기화의 심장.
   currentTime 하나가 슬라이드/노트/스크립트/타임라인을 모두 구동한다.
   (와이어프레임 6.0 공통 규칙: 모든 요소는 S# + 시점 코드를 공유)
   실연동 시 <audio> elem의 timeupdate로 교체 — 인터페이스는 동일.
   ================================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Slide } from "../types";

export const SPEEDS = [1, 1.25, 1.5, 2] as const;

export interface Playback {
  currentTime: number;
  playing: boolean;
  speed: number;
  syncOn: boolean;
  duration: number;
  activeSlideN: number;
  toggle: () => void;
  seek: (t: number, opts?: { keepSyncOff?: boolean }) => void;
  cycleSpeed: () => void;
  /** 수동 탐색 → 동기화 일시 해제 */
  breakSync: () => void;
  /** '재생 위치로' — 동기화 복귀 */
  resync: () => void;
}

export function usePlayback(slides: Slide[], duration: number, initialT = 0): Playback {
  const [currentTime, setCurrentTime] = useState(initialT);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(2); // 1.5×
  const [syncOn, setSyncOn] = useState(true);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      setCurrentTime((t) => {
        const next = t + dt * SPEEDS[speedIdx];
        if (next >= duration) { setPlaying(false); return duration; }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing, speedIdx, duration]);

  const activeSlideN = useMemo(() => {
    const s = slides.find((sl) => currentTime >= sl.startSec && currentTime < sl.endSec);
    return s?.n ?? slides[slides.length - 1]?.n ?? 1;
  }, [slides, currentTime]);

  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const seek = useCallback((t: number, opts?: { keepSyncOff?: boolean }) => {
    setCurrentTime(Math.max(0, Math.min(duration, t)));
    if (!opts?.keepSyncOff) setSyncOn(true); // 점프는 동기화 복귀로 간주
  }, [duration]);
  const cycleSpeed = useCallback(() => setSpeedIdx((i) => (i + 1) % SPEEDS.length), []);
  const breakSync = useCallback(() => setSyncOn(false), []);
  const resync = useCallback(() => setSyncOn(true), []);

  return { currentTime, playing, speed: SPEEDS[speedIdx], syncOn, duration, activeSlideN, toggle, seek, cycleSpeed, breakSync, resync };
}
