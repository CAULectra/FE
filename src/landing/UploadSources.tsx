/* ================================================================
   UploadSources — §2 카드 01 비주얼
   Krepling "Personalized experiences" 카드 패턴:
   소스 아이콘 3개(Slides/Audio/Images), 클릭하면 아이콘 뒤로
   물방울 리플(동심원)이 퍼짐. 화면 안에 있으면 은은한 자동 리플 순환.
   reduced-motion이면 자동 리플 없이 정적(클릭 리플만 CSS가 무시).
   ================================================================ */
import { useEffect, useRef, useState } from "react";

const SOURCES = [
  {
    key: "slides",
    label: "Slides",
    sub: "slides.pdf · 42p",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M7 9h10M7 13h6" />
      </svg>
    ),
  },
  {
    key: "audio",
    label: "Audio recordings",
    sub: "recording.m4a · 61:30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
      </svg>
    ),
  },
  {
    key: "images",
    label: "Images",
    sub: "board photos ×8",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-4-4-8 8" />
      </svg>
    ),
  },
];

export default function UploadSources() {
  const rootRef = useRef<HTMLDivElement>(null);
  /* 아이템별 리플 세대 카운터 — 값이 바뀌면 rings가 key 교체로 리마운트되어 애니메이션 재생 */
  const [bursts, setBursts] = useState<number[]>([0, 0, 0]);
  const [pop, setPop] = useState(-1);
  const visRef = useRef(false);
  const cycleRef = useRef(0);

  const ripple = (i: number, withPop: boolean) => {
    setBursts((b) => b.map((v, k) => (k === i ? v + 1 : v)));
    if (withPop) setPop(i);
  };

  /* 자동 리플 순환 (화면 안 + 모션 허용 시에만) */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { visRef.current = e.isIntersecting; }),
      { threshold: 0.4 },
    );
    io.observe(root);
    const t = window.setInterval(() => {
      if (!visRef.current) return;
      ripple(cycleRef.current % SOURCES.length, false);
      cycleRef.current += 1;
    }, 2600);
    return () => { io.disconnect(); window.clearInterval(t); };
  }, []);

  return (
    <div className="upload-sources" ref={rootRef}>
      {/* merged-shape: 유기적으로 이어진 라운드 셀 3개 — 각 셀에 소스 하나씩 */}
      <svg className="us-shape" viewBox="0 0 522 322" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g fill="#ffffff">
          <path d="M 54 26 L 158 26 A 28 28 0 0 1 186 54 L 186 176 L 186 176 L 54 176 A 28 28 0 0 1 26 148 L 26 54 A 28 28 0 0 1 54 26 Z" />
          <path d="M 186 146 L 346 146 L 346 146 L 346 268 A 28 28 0 0 1 318 296 L 214 296 A 28 28 0 0 1 186 268 L 186 146 L 186 146 Z" />
          <path d="M 374 66 L 468 66 A 28 28 0 0 1 496 94 L 496 168 A 28 28 0 0 1 468 196 L 346 196 L 346 196 L 346 94 A 28 28 0 0 1 374 66 Z" />
          <path d="M 186 118 C 186 139 191.6 146 214 146 H 186 Z" />
          <path d="M 186 204 C 186 183 180.4 176 158 176 H 186 Z" />
          <path d="M 346 224 C 346 203 351.6 196 374 196 H 346 Z" />
          <path d="M 346 118 C 346 139 340.4 146 318 146 H 346 Z" />
        </g>
      </svg>
      {SOURCES.map((s, i) => (
        <button
          key={s.key}
          type="button"
          className={`us-item us-c${i}${pop === i ? " pop" : ""}`}
          aria-label={s.label}
          onClick={() => ripple(i, true)}
          onAnimationEnd={() => setPop((p) => (p === i ? -1 : p))}
        >
          <span className="us-iconwrap">
            {bursts[i] > 0 && (
              <span className="us-rings" key={bursts[i]} aria-hidden="true">
                <i></i><i></i><i></i>
              </span>
            )}
            <span className="us-icon">{s.icon}</span>
          </span>
          <b>{s.label}</b>
          <small>{s.sub}</small>
        </button>
      ))}
    </div>
  );
}
