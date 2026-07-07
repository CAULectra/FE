/* ================================================================
   ScrollStack — "스크롤하며 쌓이는" 카드 스택.
   핀 고정은 브라우저 네이티브 position:sticky (견고). 묻히는 카드에는
   GSAP 스크럽으로 살짝 스케일 다운을 줘 깊이감을 낸다.
   페이지의 기존 Lenis + ScrollTrigger에 편승(별도 Lenis 생성 안 함).
   ⚠️ 조상에 overflow:hidden/clip 있으면 sticky가 깨지므로 워크플로우
      섹션은 overflow:visible 이어야 한다(landing.css 참고).
   ================================================================ */
import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollStackItem({
  children,
  itemClassName = "",
}: {
  children: ReactNode;
  itemClassName?: string;
}) {
  return <div className={`scroll-stack-card ${itemClassName}`}>{children}</div>;
}

interface ScrollStackProps {
  children: ReactNode;
  className?: string;
  /** 카드 사이 세로 간격(px) — 스택이 쌓이기까지 스크롤 거리 */
  itemDistance?: number;
  /** 카드가 묻힐 때마다 줄어드는 스케일 증분 */
  itemScale?: number;
  /** 쌓인 카드끼리 상단에서 드러나는 sliver 오프셋(px) */
  itemStackDistance?: number;
  /** 카드가 핀 고정되는 뷰포트 상단 위치(vh %) */
  stackPosition?: string;
  /** (호환용, 미사용) */
  scaleEndPosition?: string;
  /** 가장 아래(먼저 묻히는) 카드의 최종 스케일 */
  baseScale?: number;
  /** (호환용, 항상 window 스크롤 사용) */
  useWindowScroll?: boolean;
}

export default function ScrollStack({
  children,
  className = "",
  itemDistance = 90,
  itemScale = 0.03,
  itemStackDistance = 24,
  stackPosition = "15%",
  baseScale = 0.88,
}: ScrollStackProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(
      root.querySelectorAll<HTMLElement>(".scroll-stack-card"),
    );
    if (cards.length === 0) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const stackTopPx = (parseFloat(stackPosition) / 100) * window.innerHeight;

    // 각 카드: sticky top(계단식 sliver) + 카드 간 간격
    cards.forEach((card, i) => {
      card.style.position = "sticky";
      card.style.top = `${Math.round(stackTopPx + i * itemStackDistance)}px`;
      card.style.marginBottom =
        i === cards.length - 1 ? "0px" : `${itemDistance}px`;
      card.style.transformOrigin = "50% 0%";
      card.style.willChange = "transform";
      card.style.zIndex = String(i + 1); // 뒤 카드가 위로 쌓이도록
    });

    if (prefersReduced) return; // 스케일 스크럽 생략(핀 고정만)

    // 묻히는 카드 스케일 다운: 다음 카드가 덮는 구간 동안 스크럽
    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return; // 최상단(마지막) 카드는 안 묻힘
        const next = cards[i + 1];
        const target = baseScale + i * itemScale;
        gsap.fromTo(
          card,
          { scale: 1 },
          {
            scale: target,
            ease: "none",
            scrollTrigger: {
              trigger: next,
              start: "top bottom",
              end: `top ${Math.round(stackTopPx + i * itemStackDistance)}px`,
              scrub: true,
            },
          },
        );
      });
    }, root);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [itemDistance, itemScale, itemStackDistance, stackPosition, baseScale]);

  return (
    <div ref={rootRef} className={`scroll-stack ${className}`}>
      {children}
    </div>
  );
}
