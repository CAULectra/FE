/* ================================================================
   useIsMobile — 좁은 뷰포트(모바일) 감지
   랜딩의 무거운 스택(Spline WebGL·GSAP·Lenis·ScrollStack)을
   모바일에서 건너뛰기 위한 게이트. 초기값을 matchMedia로 동기 계산해
   데스크톱 랜딩이 잠깐 번쩍이는 현상(FOUC)을 방지한다.
   ================================================================ */
import { useEffect, useState } from "react";

const QUERY = "(max-width: 768px)";

function readMatch() {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(readMatch);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
