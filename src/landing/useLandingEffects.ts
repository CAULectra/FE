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
      gsap.from(".hero-aside > *", { opacity: 0, y: 40, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.8 });
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
        .to(".taglines", { opacity: 1, duration: 0.12 }, 0.38)
        .from(".tagline.tl-slides", { y: 110, opacity: 0, duration: 0.16 }, 0.42)
        .from(".tagline.tl-audio", { y: 110, opacity: 0, duration: 0.16 }, 0.55)
        .from(".tagline.tl-images", { y: 110, opacity: 0, duration: 0.16 }, 0.68)
        .from(".tagline .icon-card", { rotate: -12, scale: 0.6, duration: 0.14, stagger: 0.12 }, 0.44)
        // 히어로 끝을 walkthrough와 같은 #120F17로 페이드 → 두 섹션 자연스럽게 연결
        .to(".hero-outro", { opacity: 1, ease: "none", duration: 0.15 }, 0.85);

      const scrollInd = root.querySelector<HTMLElement>("#scroll-ind");
      if (scrollInd) scrollInd.onclick = () => lenis.scrollTo("#walkthrough", { offset: 0, duration: 1.4 });

      /* ---------- walkthrough: pinned 5-step ---------- */
      {
        const STEPS = 5;
        const WT_URLS = ["lectra.app/upload", "lectra.app/upload", "lectra.app/upload", "lectra.app/lecture/new", "lectra.app/lecture/new"];
        const lines = root.querySelectorAll<HTMLElement>("#wt-line span");
        const tiles = root.querySelectorAll<HTMLElement>(".tile");
        const boardEl = root.querySelector<HTMLElement>("#wt-board");
        const stepBtns = root.querySelectorAll<HTMLElement>(".step-btn");
        const bars = root.querySelectorAll<HTMLElement>(".step-btn .bar i");
        let cur = -1;

        const setStep = (i: number) => {
          const br = root.querySelector("#wt-browser");
          if (br) br.setAttribute("data-step", String(i));
          const u = root.querySelector("#wt-url");
          if (u) u.textContent = WT_URLS[i] || WT_URLS[0];
          if (i === cur) return;
          cur = i;
          // 누적 리빌: data-tile ≤ min(i, 타일수-1)인 타일만 표시(되감으면 역순 제거)
          const filled = Math.min(i, tiles.length - 1);
          tiles.forEach((t) => {
            const ti = +(t.dataset.tile ?? -1);
            t.classList.toggle("in", ti <= filled);
            t.classList.toggle("active", ti === i);
          });
          // 마지막 스텝: 보드 전체 '정렬 완료' 상태
          if (boardEl) boardEl.classList.toggle("aligned", i >= STEPS - 1);
          stepBtns.forEach((b, bi) => b.classList.toggle("active", bi === i));
          lines.forEach((l, li) => gsap.to(l, { opacity: li === i ? 1 : 0, y: li === i ? 0 : li < i ? -24 : 24, duration: 0.45, ease: "power3.out" }));
        };
        setStep(0);

        // 여백(bridge) → walkthrough 자연 연결: #120F17 커버(.wt-intro)를 걷어내며
        // 콘텐츠 fade-in. 핀 시작 직전 완료. 핀 대상 opacity를 안 건드려 안정적.
        gsap.fromTo(".wt-intro", { opacity: 1 }, {
          opacity: 0, ease: "none",
          scrollTrigger: { trigger: "#walkthrough", start: "top 85%", end: "top 12%", scrub: true },
        });

        const st = ScrollTrigger.create({
          trigger: "#walkthrough", start: "top top", end: "+=3600",
          pin: "#wt-pin", scrub: true, anticipatePin: 1,
          onUpdate(self) {
            const p = self.progress * STEPS;
            const i = Math.min(STEPS - 1, Math.floor(p));
            setStep(i);
            bars.forEach((bar, bi) => {
              const local = gsap.utils.clamp(0, 1, p - bi);
              bar.style.transform = `scaleX(${bi < STEPS - 1 ? local : 0})`;
            });
          },
        });
        const scrollToStep = (i: number) => {
          const y = st.start + ((i + 0.5) / STEPS) * (st.end - st.start);
          lenis.scrollTo(y, { duration: 1.1 });
        };
        stepBtns.forEach((b, i) => { b.onclick = () => scrollToStep(i); });
        const restart = root.querySelector<HTMLElement>("#restart");
        if (restart) restart.onclick = () => scrollToStep(0);
      }

      /* ---------- testimonials: 스태거 등장 + 둥실 플로팅 ---------- */
      {
        const quotes = gsap.utils.toArray<HTMLElement>(".quote-card");
        gsap.from(quotes, {
          scrollTrigger: { trigger: ".overview-testimonials", start: "top 80%" },
          y: 70, opacity: 0, rotate: (i: number) => (i % 2 ? 3 : -3),
          duration: 0.9, ease: "power3.out", stagger: 0.16,
        });
        quotes.forEach((q, i) =>
          gsap.to(q, { y: i % 2 ? -9 : -14, duration: 2.6 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.9 + i * 0.35 }),
        );
      }

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
