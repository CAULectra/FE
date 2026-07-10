/* ================================================================
   useLandingEffects — landing page interactions
   GSAP + ScrollTrigger + Lenis. gsap.context로 마운트/언마운트 관리.
   ================================================================ */
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export function useLandingEffects(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    /* ---------- Lenis smooth scroll ---------- */
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    const rafTick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(rafTick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      /* ---------- rolling label buttons ---------- */
      root.querySelectorAll<HTMLElement>("[data-roll]").forEach((el) => {
        const label = (el.textContent ?? "").trim();
        el.textContent = "";
        const roll = document.createElement("span");
        roll.className = "roll";
        const mk = (cls?: string) => {
          const line = document.createElement("span");
          line.className = "line" + (cls ? " " + cls : "");
          [...label].forEach((ch, i) => {
            const c = document.createElement("span");
            c.className = "c";
            c.style.setProperty("--i", String(i));
            c.textContent = ch === " " ? " " : ch;
            line.appendChild(c);
          });
          return line;
        };
        roll.appendChild(mk());
        roll.appendChild(mk("clone"));
        el.appendChild(roll);
      });

      /* ---------- dock home ---------- */
      const dockHome = root.querySelector<HTMLElement>("#dock-home");
      if (dockHome) dockHome.onclick = () => lenis.scrollTo(0, { duration: 1.4 });

      /* ---------- hero: split-letter intro ---------- */
      const title = root.querySelector<HTMLElement>("#hero-title");
      if (title) {
        const parts = title.innerHTML.split(/<br\s*\/?>/i);
        title.innerHTML = "";
        parts.forEach((line, li) => {
          if (li) title.appendChild(document.createElement("br"));
          line.trim().split(" ").forEach((word, wi, arr) => {
            const w = document.createElement("span");
            w.className = "word";
            [...word].forEach((ch) => {
              const box = document.createElement("span");
              box.className = "ch";
              const inner = document.createElement("i");
              inner.textContent = ch;
              box.appendChild(inner);
              w.appendChild(box);
            });
            title.appendChild(w);
            if (wi < arr.length - 1) title.appendChild(document.createTextNode(" "));
          });
        });
        gsap.fromTo(title.querySelectorAll(".ch i"),
          { yPercent: 115, y: 0 },
          { yPercent: 0, y: 0, duration: 1.1, ease: "power4.out", stagger: 0.028, delay: 0.15 });
      }
      gsap.from(".hero-sub", { opacity: 0, y: 40, duration: 1, ease: "power3.out", delay: 0.8 });
      gsap.from(".top-nav", { opacity: 0, y: -24, duration: 0.9, ease: "power3.out", delay: 0.4 });

      /* scroll phase: 타이틀 아웃 → 태그라인 인 */
      const heroTl = gsap.timeline({
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      heroTl.to(".stage", { y: -80, opacity: 0, ease: "none", duration: 0.3 }, 0.05)
        .to(".top-nav", { opacity: 0, y: -30, duration: 0.2 }, 0.05)
        .to("#discs", { scale: 1.015, ease: "none", duration: 0.5 }, 0.1)
        .to(".hero-dim", { opacity: 1, ease: "none", duration: 0.5 }, 0.1)
        .to(".scroll-ind", { opacity: 0, duration: 0.08 }, 0)
        .set(".taglines", { pointerEvents: "auto" })
        .to(".taglines", { opacity: 1, duration: 0.12 }, 0.32)
        .from(".tagline.tl-slides", { y: 110, opacity: 0, duration: 0.16 }, 0.36)
        .from(".tagline.tl-audio", { y: 110, opacity: 0, duration: 0.16 }, 0.46)
        .from(".tagline.tl-images", { y: 110, opacity: 0, duration: 0.16 }, 0.56)
        .from(".tagline .icon-card", { rotate: -12, scale: 0.6, duration: 0.14, stagger: 0.12 }, 0.38)
        // 태그라인 카피 — 태그라인들과 동일한 슬라이드업으로 마지막에 등장
        .from(".tagline-copy", { y: 110, opacity: 0, duration: 0.16 }, 0.68)
        // 태그라인 유지(hold) 후 히어로 끝(0.86→1.0)에 아웃로(다크)가 완전히 덮어 fade-out 완료.
        // → 언핀 시점엔 이미 태그라인이 사라진 상태 → 그 다음 브릿지(다크 갭) → 카드 등장.
        .to(".hero-outro", { opacity: 1, ease: "none", duration: 0.14 }, 0.86);

      const scrollInd = root.querySelector<HTMLElement>("#scroll-ind");
      if (scrollInd) scrollInd.onclick = () => lenis.scrollTo("#walkthrough", { offset: 0, duration: 1.4 });

      /* ---------- §2 카드 섹션: 마지막 카드 스크롤과 함께 배경 다크→크림 ---------- */
      {
        const cardsSection = root.querySelector<HTMLElement>(".cards-section");
        const lastCard = root.querySelector<HTMLElement>(".cards-section .scroll-stack-card:last-child");
        if (cardsSection && lastCard) {
          gsap.fromTo(
            cardsSection,
            { backgroundColor: "#120F17" },
            {
              backgroundColor: "#f6f1eb",
              ease: "none",
              scrollTrigger: { trigger: lastCard, start: "top 88%", end: "top 40%", scrub: true },
            },
          );
        }
      }

      /* testimonials: Logo Loop 수직 순환(QuoteLoop.tsx)이 담당 —
         구 스태거 등장·플로팅은 트랙 이동과 충돌해 제거. 등장은 .reveal이 처리 */

      /* ---------- generic reveals ---------- */
      root.querySelectorAll(".reveal").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 82%" },
          y: 70, opacity: 0, duration: 1.1, ease: "power3.out",
        });
      });

      gsap.from(".giant-lectra", {
        scrollTrigger: { trigger: ".giant-lectra", start: "top 95%" },
        yPercent: 40, opacity: 0, duration: 1.2, ease: "power3.out",
      });
    }, root);

    /* 폰트 로드 후 핀 위치 재계산 */
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    if (document.fonts?.ready) document.fonts.ready.then(refresh);

    return () => {
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(rafTick);
      lenis.destroy();
      ctx.revert(); // 모든 트윈/ScrollTrigger 해제
    };
  }, [rootRef]);
}
