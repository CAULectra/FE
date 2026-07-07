/* ================================================================
   LandingDock — 하단 독 네비 (§0)
   모양·마크업·CSS는 기존 .dock 그대로, ReactBits Dock의
   macOS식 magnification(마우스 거리 → 스프링 스케일)만 이식.
   - motion/react 스프링: mass .1 / stiffness 150 / damping 12 (ReactBits 기본값)
   - 텍스트 필이라 width/height 대신 transform scale + y 리프트 (레이아웃 불변)
   - 드롭업은 .dock-item 기준 앵커라 스케일 영향 없음
   - reduced-motion이면 정적 렌더
   ================================================================ */
import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
  type SpringOptions,
} from "motion/react";

const SPRING: SpringOptions = { mass: 0.1, stiffness: 150, damping: 12 };
const DIST = 150; // 영향 반경(px)

function Mag({
  mouseX,
  children,
  max = 1.18,
  reduced = false,
}: {
  mouseX: MotionValue<number>;
  children: ReactNode;
  /** 커서가 정중앙일 때 최대 스케일 */
  max?: number;
  reduced?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const dist = useTransform(mouseX, (v) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || v === Infinity) return DIST;
    return v - (r.left + r.width / 2);
  });
  const target = useTransform(dist, [-DIST, 0, DIST], [1, max, 1]);
  const scale = useSpring(target, SPRING);
  const y = useTransform(scale, (s) => -(s - 1) * 11);

  if (reduced) return <div className="dock-mag">{children}</div>;

  return (
    <motion.div
      ref={ref}
      className="dock-mag"
      style={{ scale, y, transformOrigin: "50% 100%" }}
      onFocusCapture={() => {
        const r = ref.current?.getBoundingClientRect();
        if (r) mouseX.set(r.left + r.width / 2);
      }}
      onBlurCapture={() => mouseX.set(Infinity)}
    >
      {children}
    </motion.div>
  );
}

export default function LandingDock() {
  const mouseX = useMotionValue(Infinity);
  const reduced = useReducedMotion() ?? false;

  return (
    <nav
      className="dock"
      id="dock"
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      <Mag mouseX={mouseX} max={1.3} reduced={reduced}>
        <button className="dock-home" id="dock-home" title="맨 위로">⌂</button>
      </Mag>
      <div className="dock-links">
        <div className="dock-item">
          <Mag mouseX={mouseX} reduced={reduced}>
            <button className="dock-link">Product <span className="chev">▼</span></button>
          </Mag>
          <div className="dropup">
            <a href="/lecture/w10">Workspace <small>동기화 노트 · Q&A · 번역</small></a>
            <a href="/library">Library <small>폴더 · 검색 · 처리 현황</small></a>
            <a href="#walkthrough">How it works <small>5단계 워크스루</small></a>
          </div>
        </div>
        <Mag mouseX={mouseX} reduced={reduced}>
          <a className="dock-link" href="/library">Workspace ↗</a>
        </Mag>
        <div className="dock-item">
          <Mag mouseX={mouseX} reduced={reduced}>
            <button className="dock-link">Company <span className="chev">▼</span></button>
          </Mag>
          <div className="dropup">
            <a href="mailto:focustationcapstone@gmail.com">Team contact</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>
    </nav>
  );
}
