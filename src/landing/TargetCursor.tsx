// @ts-nocheck
/* TargetCursor — 네이티브 커서를 대체하는 "타겟 락온 + 맥락 라벨" 커서.
   .cursor-target 위에 hover하면 4코너 프레임이 그 요소를 감싸고, 요소의
   data-cursor-label 텍스트를 바이올렛 라벨로 띄운다(슬라이드/녹음/필기…).
   클릭하면 확대(촉각 피드백). body로 portal, GSAP로 부드럽게 추종.
   터치기기·prefers-reduced-motion에서는 비활성(네이티브 커서 유지). */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";

import "./TargetCursor.css";

const TargetCursor = ({
  targetSelector = ".cursor-target",
  labelAttr = "data-cursor-label",
  size = 30,          // 평소 프레임 한 변(px)
  padding = 12,       // 락온 시 요소 주위 여백(px)
  color = "#b154f9",  // Krepling Bolt Violet
}) => {
  const [enabled, setEnabled] = useState(false);
  const frameRef = useRef(null);
  const dotRef = useRef(null);
  const labelRef = useRef(null);

  // 터치/reduced-motion 가드는 마운트 후 판단 (fine pointer일 때만 켠다)
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduced);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const frame = frameRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!frame || !dot) return;

    // 네이티브 커서 숨김(인터랙티브 요소 포함 전역) — CSS의 html.tc-active 규칙
    document.documentElement.classList.add("tc-active");

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let locked = null;

    gsap.set([frame, dot], { xPercent: -50, yPercent: -50 });
    gsap.set(frame, { width: size, height: size, x: mouse.x, y: mouse.y });
    gsap.set(dot, { x: mouse.x, y: mouse.y });
    if (label) gsap.set(label, { x: mouse.x, y: mouse.y, autoAlpha: 0 });

    const fx = gsap.quickTo(frame, "x", { duration: 0.35, ease: "power3" });
    const fy = gsap.quickTo(frame, "y", { duration: 0.35, ease: "power3" });
    const dx = gsap.quickTo(dot, "x", { duration: 0.14, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.14, ease: "power3" });
    const lx = label ? gsap.quickTo(label, "x", { duration: 0.2, ease: "power3" }) : null;
    const ly = label ? gsap.quickTo(label, "y", { duration: 0.2, ease: "power3" }) : null;

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      dx(mouse.x); dy(mouse.y);
      if (lx) { lx(mouse.x); ly(mouse.y); }
      if (!locked) { fx(mouse.x); fy(mouse.y); } // 락온 중엔 프레임이 요소에 고정
    };

    const lockOn = (el) => {
      locked = el;
      const r = el.getBoundingClientRect();
      fx(r.left + r.width / 2);
      fy(r.top + r.height / 2);
      gsap.to(frame, { width: r.width + padding * 2, height: r.height + padding * 2, duration: 0.35, ease: "power3" });
      frame.classList.add("is-locked");
      gsap.to(dot, { scale: 0.35, duration: 0.25 });
      const text = el.getAttribute(labelAttr);
      if (label) {
        if (text) { label.textContent = text; gsap.to(label, { autoAlpha: 1, duration: 0.2 }); }
        else gsap.to(label, { autoAlpha: 0, duration: 0.15 });
      }
    };

    const unlock = () => {
      locked = null;
      gsap.to(frame, { width: size, height: size, duration: 0.3, ease: "power3" });
      frame.classList.remove("is-locked");
      fx(mouse.x); fy(mouse.y);
      gsap.to(dot, { scale: 1, duration: 0.25 });
      if (label) gsap.to(label, { autoAlpha: 0, duration: 0.15 });
    };

    const onOver = (e) => {
      const el = e.target?.closest ? e.target.closest(targetSelector) : null;
      if (el && el !== locked) lockOn(el);
    };
    const onOut = (e) => {
      if (!locked) return;
      const el = e.target?.closest ? e.target.closest(targetSelector) : null;
      if (el === locked && !locked.contains(e.relatedTarget)) unlock();
    };

    // 클릭 = 확대(촉각 피드백)
    const onDown = () => {
      gsap.to(frame, { scale: 1.5, duration: 0.2, ease: "back.out(3)" });
      gsap.to(dot, { scale: locked ? 0.55 : 1.5, duration: 0.2, ease: "back.out(3)" });
    };
    const onUp = () => {
      gsap.to(frame, { scale: 1, duration: 0.3, ease: "power3" });
      gsap.to(dot, { scale: locked ? 0.35 : 1, duration: 0.3, ease: "power3" });
    };

    // 락온된 요소가 스크롤로 이동하면 프레임 위치 갱신
    const onScroll = () => {
      if (!locked) return;
      const r = locked.getBoundingClientRect();
      fx(r.left + r.width / 2);
      fy(r.top + r.height / 2);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.documentElement.classList.remove("tc-active");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("scroll", onScroll);
      gsap.killTweensOf([frame, dot, label]);
    };
  }, [enabled, targetSelector, labelAttr, size, padding]);

  if (!enabled) return null;

  return createPortal(
    <div className="target-cursor-root" aria-hidden="true" style={{ "--tc-color": color }}>
      <div ref={frameRef} className="tc-frame">
        <span className="tc-corner tl" /><span className="tc-corner tr" />
        <span className="tc-corner br" /><span className="tc-corner bl" />
      </div>
      <div ref={dotRef} className="tc-dot" />
      <div ref={labelRef} className="tc-label" />
    </div>,
    document.body,
  );
};

export default TargetCursor;
