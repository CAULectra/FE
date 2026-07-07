/* ================================================================
   AlignMap — §2 카드 02 비주얼 (링크 프로토타입 60a6bdcc의 Align 버전)
   파형 draw → 수직 연결선 3개가 아래로 snap → 슬라이드 썸네일 등장(가운데 cur)
   → 세그먼트 칩(S9~S15) 점등 → 진행 게이지 100% → ✓ Aligned. 루프 4.9s.
   화면 밖이면 정지, prefers-reduced-motion이면 완성 정지 상태.
   ================================================================ */
import { useEffect, useRef } from "react";

const BARS = 26;
const SEGS = ["S9", "S10", "S11", "S12", "S13", "S14", "S15"];
const CUR_SEG = 2; // S11

export default function AlignMap() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const thumbs = Array.from(root.querySelectorAll<HTMLElement>(".am-thumb"));
    const lines = Array.from(root.querySelectorAll<SVGLineElement>(".am-cline"));
    const segs = Array.from(root.querySelectorAll<HTMLElement>(".am-seg"));
    const prog = root.querySelector<HTMLElement>(".am-prog i");
    const aligned = root.querySelector<HTMLElement>(".am-aligned");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finalState = () => {
      root.classList.add("play");
      thumbs.forEach((t) => t.classList.add("on"));
      lines.forEach((l) => l.classList.add("on"));
      segs.forEach((s) => s.classList.add("on"));
      segs[CUR_SEG]?.classList.add("cur");
      prog?.classList.add("on");
      aligned?.classList.add("on");
    };
    if (reduced) { finalState(); return; }

    let cyc = 0;
    let timers: number[] = [];
    let running = false;

    const reset = () => {
      timers.forEach(window.clearTimeout);
      timers = [];
      root.classList.add("noT");
      root.classList.remove("play");
      Array.from(root.querySelectorAll(".on")).forEach((e) => e.classList.remove("on"));
      segs.forEach((s) => s.classList.remove("cur"));
      void root.offsetWidth;
      root.classList.remove("noT");
    };
    const play = () => {
      const id = ++cyc;
      reset();
      const at = (fn: () => void, t: number) =>
        timers.push(window.setTimeout(() => { if (id === cyc) fn(); }, t));
      at(() => root.classList.add("play"), 60);                                  /* 파형 스태거 인 */
      thumbs.forEach((t, i) => at(() => t.classList.add("on"), 800 + i * 130)); /* 썸네일 */
      lines.forEach((l, i) => at(() => l.classList.add("on"), 1350 + i * 120)); /* 연결선 snap */
      segs.forEach((s, i) => at(() => s.classList.add("on"), 1900 + i * 90));   /* 세그먼트 */
      at(() => segs[CUR_SEG]?.classList.add("cur"), 2550);
      at(() => prog?.classList.add("on"), 2750);                                 /* 게이지 */
      at(() => aligned?.classList.add("on"), 3700);                              /* ✓ Aligned */
      at(() => { if (running) play(); }, 5100);
    };

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting && !running) { running = true; play(); }
        else if (!e.isIntersecting && running) { running = false; cyc++; timers.forEach(window.clearTimeout); }
      }),
      { threshold: 0.35 },
    );
    io.observe(root);
    return () => { io.disconnect(); cyc++; timers.forEach(window.clearTimeout); };
  }, []);

  return (
    <div className="am" ref={rootRef}>
      <div className="align-wave">
        {Array.from({ length: BARS }).map((_, i) => (
          <i key={i} style={{ "--h": `${28 + ((i * 29) % 60)}%`, "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <div className="am-connect" aria-hidden="true">
        <svg viewBox="0 0 300 26" preserveAspectRatio="none">
          <line className="am-cline" x1="50" y1="0" x2="50" y2="26" pathLength="1" />
          <line className="am-cline" x1="150" y1="0" x2="150" y2="26" pathLength="1" />
          <line className="am-cline" x1="250" y1="0" x2="250" y2="26" pathLength="1" />
        </svg>
      </div>
      <div className="am-thumbs">
        <div className="am-thumb"><i></i><i></i></div>
        <div className="am-thumb cur"><i></i><i></i></div>
        <div className="am-thumb"><i></i><i></i></div>
      </div>
      <div className="am-segs">
        {SEGS.map((s) => (
          <span key={s} className="am-seg">{s}</span>
        ))}
      </div>
      <div className="am-prog"><i></i></div>
      <div className="am-prow">
        <span className="am-label">Aligning speech · slides · photos … <b>100%</b></span>
        <span className="am-aligned">✓ Aligned</span>
      </div>
    </div>
  );
}
