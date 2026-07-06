/* ================================================================
   SplineHero — 히어로 3D (my.spline.design iframe)
   정적 v4의 최적화 그대로: 0.6x 해상도 렌더 + 오버스캔 크롭(배지 제거)
   + 로드 크로스페이드 + 화면 밖 렌더링 중단
   ================================================================ */
import { useEffect, useRef, useState } from "react";

const SPLINE_URL = "https://my.spline.design/radialglass-bXeLwUVIhfJGztLAHWeVpwLi/";

const RES = 0.6;                       // 내부 해상도 60% → GPU 픽셀 0.36배
const OVER_X = 0.08, OVER_Y = 0.14;    // 오버스캔: 우4%·하10% 크롭 (Built with Spline 배지)
const SHIFT_X = 0.04, SHIFT_Y = 0.04;

export default function SplineHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  /* 히어로가 화면 밖이면 iframe 렌더링 스로틀 유도 */
  useEffect(() => {
    const hero = document.getElementById("hero");
    const iframe = iframeRef.current;
    if (!hero || !iframe) return;
    const io = new IntersectionObserver(([e]) => {
      iframe.style.visibility = e.isIntersecting ? "visible" : "hidden";
    }, { rootMargin: "120px" });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} id="discs" style={{ overflow: "hidden" }}>
      <iframe
        ref={iframeRef}
        src={SPLINE_URL}
        title="Lectra hero 3D"
        loading="eager"
        onLoad={() => setTimeout(() => setLoaded(true), 400)}
        style={{
          position: "absolute",
          top: `${-SHIFT_Y * 100}%`,
          left: `${-SHIFT_X * 100}%`,
          width: `${RES * (1 + OVER_X) * 100}%`,
          height: `${RES * (1 + OVER_Y) * 100}%`,
          transform: `scale(${1 / RES})`,
          transformOrigin: "0 0",
          border: 0,
          opacity: loaded ? 1 : 0,
          transition: "opacity 1.1s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </div>
  );
}
