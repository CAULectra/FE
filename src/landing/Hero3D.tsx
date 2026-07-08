/* ================================================================
   Hero3D — 히어로 3D 배경 (임베드 렌더)
   0.6x 해상도 렌더 + 가장자리 오버스캔 + 로드 크로스페이드
   + 화면 밖 렌더링 중단
   ================================================================ */
import { useEffect, useRef, useState } from "react";

const HERO_SCENE_URL = "https://my.spline.design/radialglass-bXeLwUVIhfJGztLAHWeVpwLi/";
const HERO_ORIGIN = "https://my.spline.design";

const RES = 0.73;                      // 내부 해상도 — 씬 카메라가 캔버스 크기에 반응: 값을 올리면 프레이밍이 물러나 디스크가 작아 보임(0.48=과확대, 0.6=기존, 0.65=크게 느껴짐). 값이 커질수록 초기 렌더가 무거워 등장이 살짝 느려지는 트레이드오프
const OVER_X = 0.045, OVER_Y = 0.11;   // 가장자리 오버스캔(외곽 여백 제거)
const LOAD_DELAY_MS = 0;               // 즉시 로드 시작 (폴백 노출 최소화)
const FADE_DELAY_MS = 60;              // 로드 직후 거의 즉시 페이드 시작(빠릿한 등장 우선). warmup 안 함 — 첫 프레임 약간의 버벅임은 감수하고 속도 우선

type IdleWindow = {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function requestIdle(fn: () => void, timeout = 1400) {
  const idleWindow = window as unknown as IdleWindow;
  if (idleWindow.requestIdleCallback) return idleWindow.requestIdleCallback(fn, { timeout });
  return window.setTimeout(fn, timeout);
}

function cancelIdle(handle: number) {
  const idleWindow = window as unknown as IdleWindow;
  if (idleWindow.cancelIdleCallback) {
    idleWindow.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
}

function addResourceHints() {
  if (document.head.querySelector('link[data-hero-hint="preconnect"]')) return;

  const dns = document.createElement("link");
  dns.rel = "dns-prefetch";
  dns.href = HERO_ORIGIN;
  dns.dataset.heroHint = "dns";
  document.head.appendChild(dns);

  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = HERO_ORIGIN;
  preconnect.crossOrigin = "anonymous";
  preconnect.dataset.heroHint = "preconnect";
  document.head.appendChild(preconnect);
}

export default function Hero3D() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const idleRef = useRef<number | null>(null);
  const loadTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const [src, setSrc] = useState<string>();
  const [loaded, setLoaded] = useState(false);

  /* 3D 씬 초기화를 첫 페인트 직후로 미뤄 히어로 진입 버벅임을 줄임 */
  useEffect(() => {
    addResourceHints();

    loadTimerRef.current = window.setTimeout(() => {
      idleRef.current = requestIdle(() => {
        setSrc(HERO_SCENE_URL);
      }, 120);
    }, LOAD_DELAY_MS);

    return () => {
      if (loadTimerRef.current !== null) window.clearTimeout(loadTimerRef.current);
      if (idleRef.current !== null) cancelIdle(idleRef.current);
      if (fadeTimerRef.current !== null) window.clearTimeout(fadeTimerRef.current);
    };
  }, []);

  /* 히어로가 화면 밖이면 렌더링 스로틀 유도 */
  useEffect(() => {
    const hero = document.getElementById("hero");
    const iframe = iframeRef.current;
    if (!hero || !iframe) return;
    const io = new IntersectionObserver(([e]) => {
      iframe.style.visibility = e.isIntersecting ? "visible" : "hidden";
    }, { rootMargin: "120px" });
    io.observe(hero);
    return () => io.disconnect();
  }, [src]);

  const handleLoad = () => {
    fadeTimerRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => setLoaded(true));
    }, FADE_DELAY_MS);
  };

  /* 3D 씬이 뜨면 폴백 블롭(blur 90px ×3 · soft-light)을 꺼서 매 프레임 합성 비용 제거.
     빠른 등장 우선이라 페이드(0.3s)에 맞춰 300ms에 조기 제거 — 무거운 합성 구간 최소화. */
  useEffect(() => {
    if (!loaded) return;
    const bg = document.querySelector(".hero-bg");
    const t = window.setTimeout(() => bg?.classList.add("scene-on"), 300);
    return () => {
      window.clearTimeout(t);
      bg?.classList.remove("scene-on");
    };
  }, [loaded]);

  return (
    <div id="discs" style={{ overflow: "hidden" }}>
      {src ? (
        <iframe
          ref={iframeRef}
          src={src}
          title="Lectra hero 3D"
          aria-hidden="true"
          loading="lazy"
          onLoad={handleLoad}
          style={{
            position: "absolute",
            width: `${RES * (1 + OVER_X) * 100}%`,
            height: `${RES * (1 + OVER_Y) * 100}%`,
            transform: `scale(${1 / RES})`,
            transformOrigin: "0 0",
            border: 0,
            opacity: loaded ? 1 : 0,
            /* transform은 정적(1/RES 고정) — 무거운 WebGL 캔버스에 scale 애니메이션 금지.
               빠르되 갑작스럽지 않게 — 짧은 지연 + 시작이 부드러운 ease-in-out opacity 페이드 */
            transition: "opacity 0.42s cubic-bezier(0.4,0,0.2,1)",
            willChange: "opacity",
          }}
        />
      ) : null}
    </div>
  );
}
