/* ================================================================
   useLandingEffects — 정적 v4의 인터랙션 스크립트를 React로 포팅
   GSAP + ScrollTrigger + Lenis. gsap.context로 마운트/언마운트 관리.
   (Three.js 폴백은 Spline 상시 사용으로 데드코드였으므로 제외)
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

    const cleanups: (() => void)[] = [];

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
        .to("#discs", { opacity: 0.38, scale: 1.06, ease: "none", duration: 0.5 }, 0.1)
        .to(".scroll-ind", { opacity: 0, duration: 0.08 }, 0)
        .set(".taglines", { pointerEvents: "auto" })
        .to(".taglines", { opacity: 1, duration: 0.12 }, 0.38)
        .from(".tagline.tl-slides", { y: 110, opacity: 0, duration: 0.16 }, 0.42)
        .from(".tagline.tl-audio", { y: 110, opacity: 0, duration: 0.16 }, 0.55)
        .from(".tagline.tl-images", { y: 110, opacity: 0, duration: 0.16 }, 0.68)
        .from(".tagline .icon-card", { rotate: -12, scale: 0.6, duration: 0.14, stagger: 0.12 }, 0.44);

      const scrollInd = root.querySelector<HTMLElement>("#scroll-ind");
      if (scrollInd) scrollInd.onclick = () => lenis.scrollTo("#walkthrough", { offset: 0, duration: 1.4 });

      /* ---------- walkthrough: pinned 5-step ---------- */
      {
        const STEPS = 5;
        const subs = [
          "PDF·PPT 슬라이드가 강의의 뼈대가 됩니다",
          "녹음이 모든 문장에 시간을 부여합니다",
          "촬영 시각(EXIF)으로 정확한 위치에 자동 삽입",
          "STT → 추출 → 정렬 → 노트, 페이지를 떠나도 계속",
          "문장 하나를 클릭하면 전부가 따라옵니다",
        ];
        const WT_URLS = ["lectra.app/upload", "lectra.app/upload", "lectra.app/upload", "lectra.app/lecture/new", "lectra.app/lecture/new"];
        const lines = root.querySelectorAll<HTMLElement>("#wt-line span");
        const screens = root.querySelectorAll<HTMLElement>(".screen");
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
          screens.forEach((s) => s.classList.toggle("on", +(s.dataset.step ?? -1) === i));
          stepBtns.forEach((b, bi) => b.classList.toggle("active", bi === i));
          lines.forEach((l, li) => gsap.to(l, { opacity: li === i ? 1 : 0, y: li === i ? 0 : li < i ? -24 : 24, duration: 0.45, ease: "power3.out" }));
          const sub = root.querySelector("#wt-sub");
          if (sub) sub.textContent = subs[i];
        };
        setStep(0);

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

      /* ---------- app hero: parallax + reveal ---------- */
      gsap.from(".app-hero .content > *", {
        scrollTrigger: { trigger: ".app-hero", start: "top 55%" },
        y: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1,
      });
      gsap.to(".app-hero .fc1", { scrollTrigger: { trigger: ".app-hero", start: "top bottom", end: "bottom top", scrub: true }, y: -110, ease: "none" });
      gsap.to(".app-hero .fc2", { scrollTrigger: { trigger: ".app-hero", start: "top bottom", end: "bottom top", scrub: true }, y: -50, ease: "none" });

      /* ---------- generic reveals ---------- */
      root.querySelectorAll(".reveal").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 82%" },
          y: 70, opacity: 0, duration: 1.1, ease: "power3.out",
        });
      });

      /* ---------- calculator ---------- */
      {
        const RATE = 0.37;
        const input = root.querySelector<HTMLInputElement>("#calc-in");
        const out = root.querySelector<HTMLElement>("#calc-out");
        const saveEl = root.querySelector<HTMLElement>("#calc-save");
        const dd = root.querySelector<HTMLElement>("#dd-src");
        if (input && out && saveEl && dd) {
          let mult = 1, swapped = false, displayed = 0;

          dd.querySelector<HTMLElement>(".dd-btn")!.onclick = (e) => { e.stopPropagation(); dd.classList.toggle("open"); };
          const closeDd = () => dd.classList.remove("open");
          document.addEventListener("click", closeDd);
          cleanups.push(() => document.removeEventListener("click", closeDd));
          dd.querySelectorAll<HTMLElement>(".dd-list button").forEach((b) => {
            b.onclick = (e) => {
              e.stopPropagation();
              mult = +(b.dataset.mult ?? 1);
              dd.querySelector<HTMLElement>(".dd-btn .lbl")!.textContent = b.dataset.label ?? "";
              const ic = dd.querySelector<HTMLElement>(".dd-btn .ic")!;
              const src = b.querySelector<HTMLElement>(".ic")!;
              ic.style.background = src.style.background;
              ic.textContent = src.textContent;
              dd.classList.remove("open");
              update();
            };
          });

          const fmtMin = (mn: number) =>
            mn >= 90 ? Math.floor(mn / 60) + "시간 " + Math.round(mn % 60) + "분" : Math.round(mn) + "분";

          function update() {
            const v = Math.max(0, parseFloat(input!.value.replace(/[^\d.]/g, "")) || 0);
            const total = v * mult;
            const result = swapped ? total / RATE : total * RATE;
            gsap.killTweensOf(out);
            const obj = { n: displayed };
            gsap.to(obj, { n: result, duration: 0.55, ease: "power2.out", onUpdate: () => { out!.textContent = String(Math.round(obj.n)); displayed = obj.n; } });
            const saved = Math.abs(total - result);
            saveEl!.innerHTML = swapped
              ? `복습 ${fmtMin(total)}이면 강의 <b>${fmtMin(result)}</b>를 커버해요`
              : `<b>${fmtMin(saved)}</b> 절약 — 2.7× 빠른 복습`;
          }
          input.addEventListener("input", update);
          const swap = root.querySelector<HTMLElement>("#swap");
          if (swap) swap.onclick = () => {
            swapped = !swapped;
            root.querySelector("#out-label")!.textContent = swapped ? "커버하는 강의" : "Lectra 복습";
            root.querySelector("#out-cap")!.textContent = swapped ? "역방향 계산" : "정렬 노트 기준";
            root.querySelector("#calc .row1 .caption")!.textContent = swapped ? "복습 시간" : "강의 길이";
            update();
          };
          update();
        }
      }

      /* ---------- testimonials: pinned card stack ---------- */
      {
        const cards = gsap.utils.toArray<HTMLElement>(".t-card");
        cards.forEach((c, i) => gsap.set(c, { y: i * 22, scale: 1 - i * 0.045, zIndex: cards.length - i, transformOrigin: "center top" }));
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "#testimonials", start: "top top", end: "+=" + cards.length * 620, pin: "#tst-pin", scrub: 0.5 },
        });
        cards.forEach((c, i) => {
          if (i === cards.length - 1) return;
          tl.to(c, { y: -420, rotate: i % 2 ? 7 : -7, opacity: 0, duration: 1, ease: "power1.in" })
            .to(cards.slice(i + 1), {
              y: (_j: number, t: HTMLElement) => +gsap.getProperty(t, "y") - 22,
              scale: (_j: number, t: HTMLElement) => Math.min(1, +gsap.getProperty(t, "scale") + 0.045),
              duration: 1,
            }, "<");
        });
      }

      /* ---------- finale ---------- */
      gsap.from(".finale h2", {
        scrollTrigger: { trigger: ".finale", start: "top 70%" },
        scale: 0.85, opacity: 0, duration: 1.2, ease: "power3.out",
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
      cleanups.forEach((fn) => fn());
      gsap.ticker.remove(rafTick);
      lenis.destroy();
      ctx.revert(); // 모든 트윈/ScrollTrigger 해제
    };
  }, [rootRef]);
}
