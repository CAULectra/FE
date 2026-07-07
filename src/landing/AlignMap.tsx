/* ================================================================
   AlignMap — §2 카드 02 비주얼 (링크 프로토타입 60a6bdcc의 Align 버전)
   파형은 생성 단계 없이 처음부터 음악 재생처럼 이퀄라이저로 춤추고(음수
   딜레이로 위상 분산), 그 아래로 연결선 snap → 썸네일 → 세그먼트 점등 →
   게이지 100% → ✓ Aligned 시퀀스가 루프. 화면 밖이면 정지(.play 해제),
   prefers-reduced-motion이면 완성 정지 상태.
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
      /* .play(이퀄라이저)는 유지 — 파형은 루프 사이에도 계속 재생 */
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
      /* 파형은 이미 재생 중(.play) — 매핑 시퀀스만 루프 */
      thumbs.forEach((t, i) => at(() => t.classList.add("on"), 450 + i * 130)); /* 썸네일 */
      lines.forEach((l, i) => at(() => l.classList.add("on"), 1000 + i * 120)); /* 연결선 snap */
      segs.forEach((s, i) => at(() => s.classList.add("on"), 1550 + i * 90));   /* 세그먼트 */
      at(() => segs[CUR_SEG]?.classList.add("cur"), 2200);
      at(() => prog?.classList.add("on"), 2400);                                 /* 게이지 */
      at(() => aligned?.classList.add("on"), 3350);                              /* ✓ Aligned */
      at(() => { if (running) play(); }, 4750);
    };

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting && !running) { running = true; root.classList.add("play"); play(); }
        else if (!e.isIntersecting && running) { running = false; cyc++; timers.forEach(window.clearTimeout); root.classList.remove("play"); }
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
          <i
            key={i}
            style={{
              "--h": `${28 + ((i * 29) % 60)}%`,
              "--i": i,
              /* 이퀄라이저 변주 — 바마다 주기·진폭이 달라 실제 음악처럼 위상이 어긋남 */
              "--eqd": `${(0.55 + ((i * 37) % 40) / 100).toFixed(2)}s`,
              "--eqa": (0.3 + ((i * 53) % 45) / 100).toFixed(2),
            } as React.CSSProperties}
          />
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
