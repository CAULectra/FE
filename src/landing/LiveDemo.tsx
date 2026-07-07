/* ================================================================
   LiveDemo — Krepling식 "가이드 데모" 섹션 (밝은 캔버스)
   큰 문구 → 소프트 그라데이션 위 Lectra 앱 목업이 업로드→정렬→학습으로
   변신하고, 검은 화살표 커서가 움직이며 클릭 시연.

   mode:
   - "scrub"    (A/추천) 섹션을 핀 고정, 스크롤하면 목업이 열리며 화면을 채우고
                커서·단계가 스크롤 진행도에 맞춰 진행. (Krepling 방식)
   - "autoplay" 화면 안에 들어오면 스스로 재생·루프. 목업 고정 크기.
   화면 밖이면 정지, prefers-reduced-motion이면 정적(Study).
   ================================================================ */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEPS = ["Upload", "Align", "Study"] as const;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function LiveDemo({ mode = "autoplay" }: { mode?: "scrub" | "autoplay" }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const section = root; // section === root
    const pin = root.querySelector<HTMLElement>(".demo-pin");
    const stage = root.querySelector<HTMLElement>(".demo-stage");
    const lead = root.querySelector<HTMLElement>(".demo-lead");
    const app = root.querySelector<HTMLElement>(".demo-app");
    const cursor = root.querySelector<HTMLElement>(".demo-cursor");
    const tabs = Array.from(root.querySelectorAll<HTMLElement>(".demo-tab"));
    const tabsBox = root.querySelector<HTMLElement>(".demo-tabs");
    if (!pin || !stage || !app || !cursor) return;

    const setStep = (i: number) => {
      app.setAttribute("data-step", String(i));
      tabs.forEach((t, ti) => t.classList.toggle("active", ti === i));
    };
    /* 대상 중심(커서 offsetParent = .demo-pin 기준). 스케일도 rect에 반영됨 */
    const center = (sel: string, dx = 0, dy = 0) => {
      const ref = pin.getBoundingClientRect();
      const el = root.querySelector<HTMLElement>(sel);
      if (!el) return { x: ref.width / 2, y: ref.height / 2 };
      const r = el.getBoundingClientRect();
      return { x: r.left - ref.left + r.width / 2 - 4 + dx, y: r.top - ref.top + r.height / 2 - 2 + dy };
    };
    const clickFx = (sel?: string) => {
      cursor.classList.remove("click");
      void cursor.offsetWidth;
      cursor.classList.add("click");
      if (sel) {
        const h = root.querySelector<HTMLElement>(sel);
        if (h) { h.classList.add("hit"); window.setTimeout(() => h.classList.remove("hit"), 280); }
      }
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setStep(2); gsap.set(cursor, { opacity: 0 }); return; }

    /* ---------------- SCRUB (A) ---------------- */
    if (mode === "scrub") {
      const at = (sel: string, dx = 0, dy = 0) => () => center(sel, dx, dy);
      // 커서 경로 웨이포인트 (cp 0~1). click=true면 그 지점 통과 시 클릭
      const WP: { t: number; get: () => { x: number; y: number }; click?: string }[] = [
        { t: 0.0, get: at(".da-drop", 0, 42) },
        { t: 0.24, get: at(".da-cta"), click: ".da-cta" },
        { t: 0.52, get: at(".da-segs .cur") },
        { t: 0.76, get: at(".da-thumb.cur"), click: ".da-thumb.cur" },
        { t: 0.96, get: at(".da-q"), click: ".da-q" },
      ];
      let curStep = -1;
      let prevCp = 0;
      const fired = new Set<number>();

      // 시작 상태: 목업·탭 숨김(크림 위 헤드라인만) → 스크롤하면 열림
      gsap.set(stage, { transformOrigin: "50% 42%", scale: 0.66, x: 0, autoAlpha: 0 });
      if (tabsBox) gsap.set(tabsBox, { autoAlpha: 0 });
      gsap.set(cursor, { opacity: 0 });
      setStep(0);

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          // ① 열림: 헤드라인 먼저 페이드아웃 → 목업·탭 페이드인 + 확대(화면 채움)
          const f = clamp01(p / 0.24);
          const appear = clamp01((p - 0.06) / 0.12); // 목업 등장 0.06→0.18
          // 확대하며 좌측으로 살짝 이동 → 우측에 탭 거터 확보(겹침 방지, Krepling식)
          gsap.set(stage, { scale: lerp(0.66, 1.16, f), x: lerp(0, -135, f), autoAlpha: appear });
          if (tabsBox) gsap.set(tabsBox, { autoAlpha: appear });
          if (lead) gsap.set(lead, { autoAlpha: 1 - clamp01(p / 0.12), y: -40 * clamp01(p / 0.2) });
          // ② 단계 (스크롤 진행도)
          const step = p < 0.42 ? 0 : p < 0.66 ? 1 : 2;
          if (step !== curStep) { curStep = step; setStep(step); }
          // ③ 커서 경로 (cp 0.26→0.98)
          const cp = clamp01((p - 0.26) / 0.72);
          gsap.set(cursor, { opacity: p > 0.24 ? 1 : 0 });
          let i = 0;
          while (i < WP.length - 1 && cp > WP[i + 1].t) i++;
          const a = WP[i], b = WP[Math.min(i + 1, WP.length - 1)];
          const local = b.t === a.t ? 0 : clamp01((cp - a.t) / (b.t - a.t));
          const pa = a.get(), pb = b.get();
          gsap.set(cursor, { x: lerp(pa.x, pb.x, local), y: lerp(pa.y, pb.y, local) });
          // ④ 클릭: 웨이포인트 전진 통과 시 1회
          WP.forEach((w, wi) => {
            if (!w.click) return;
            if (cp >= w.t && prevCp < w.t) { if (!fired.has(wi)) { fired.add(wi); clickFx(w.click); } }
            if (cp < w.t - 0.02) fired.delete(wi); // 되감으면 재발화 허용
          });
          prevCp = cp;
        },
      });

      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);
      return () => { window.removeEventListener("resize", onResize); st.kill(); };
    }

    /* ---------------- AUTOPLAY ---------------- */
    const at = (sel: string, dx = 0, dy = 0) => ({ x: () => center(sel, dx).x, y: () => center(sel, 0, dy).y });
    let tl: ReturnType<typeof gsap.timeline> | null = null;
    const build = () => {
      tl?.kill();
      setStep(0);
      tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, defaults: { ease: "power2.inOut" }, paused: true });
      tl.call(() => setStep(0))
        .set(cursor, { opacity: 1, ...at(".da-drop", 0, 46) })
        .to(cursor, { ...at(".da-cta"), duration: 1.0 }, 0.5)
        .call(() => clickFx(".da-cta"), undefined, ">-0.04")
        .call(() => setStep(1), undefined, ">+0.42")
        .to(cursor, { ...at(".da-segs .cur"), duration: 0.85 }, ">+0.25")
        .call(() => setStep(2), undefined, ">+0.95")
        .to(cursor, { ...at(".da-thumb.cur"), duration: 0.8 }, ">+0.3")
        .call(() => clickFx(".da-thumb.cur"), undefined, ">-0.04")
        .to(cursor, { ...at(".da-q"), duration: 0.85 }, ">+0.45")
        .call(() => clickFx(".da-q"), undefined, ">-0.04")
        .to({}, { duration: 1.6 }, ">");
    };
    build();
    const st = ScrollTrigger.create({
      trigger: section, start: "top 78%", end: "bottom 22%",
      onToggle: (self) => { if (!tl) return; self.isActive ? tl.play() : tl.pause(); },
    });
    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => { const on = tl?.isActive(); build(); if (on) tl?.play(); ScrollTrigger.refresh(); }, 250);
    };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); window.clearTimeout(rt); st.kill(); tl?.kill(); };
  }, [mode]);

  /* 단계 탭 — scrub은 핀에 고정(스케일 영향 X), autoplay는 스테이지 안 */
  const tabsEl = (
    <div className="demo-tabs">
      {STEPS.map((s, i) => (
        <div key={s} className="demo-tab" data-tab={i}>
          <span className="demo-tab-n">{`0${i + 1}`}</span>{s}
        </div>
      ))}
    </div>
  );

  return (
    <section className={`demo-section${mode === "scrub" ? " is-scrub" : ""}`} id="demo" ref={rootRef}>
      <div className="demo-pin">
        {/* 큰 문구 (오렌지 강조 단어) */}
        <div className="demo-lead">
          <p className="demo-eyebrow">See it work</p>
          <h2 className="demo-headline">
            Four sources in.<br />
            <span className="accent">One exam-ready note out.</span>
          </h2>
          <p className="demo-sub">업로드부터 복습까지 — Lectra가 클릭 한 번으로 정렬합니다.</p>
        </div>

        {/* 큰 화면: 소프트 그라데이션 + 앱 목업 + 탭 */}
        <div className="demo-stage">
          <div className="demo-gradient" aria-hidden="true" />

          <div className="demo-app" data-step="0" aria-hidden="true">
            <div className="da-chrome">
              <span className="da-dots"><i></i><i></i><i></i></span>
              <span className="da-url">lectra.app/lecture/w11</span>
              <span className="da-badge da-badge-run">Processing…</span>
              <span className="da-badge da-badge-done">Ready ✓</span>
            </div>

            <div className="da-body">
              {/* STEP 0 — Upload */}
              <div className="da-pane da-upload">
                <div className="da-drop">
                  <div className="da-drop-ic">↑</div>
                  <b>Drop your lecture</b>
                  <small>슬라이드 · 녹음 · 필기 사진</small>
                </div>
                <div className="da-files">
                  <span className="da-file"><b>slides.pdf</b><small>42p</small></span>
                  <span className="da-file"><b>recording.m4a</b><small>61:30</small></span>
                  <span className="da-file"><b>board.jpg ×8</b><small>photos</small></span>
                </div>
                <button className="da-cta" data-hit="process">Process</button>
              </div>

              {/* STEP 1 — Align */}
              <div className="da-pane da-align">
                <div className="da-wave">
                  {Array.from({ length: 26 }).map((_, i) => (
                    <i key={i} style={{ height: `${24 + ((i * 23) % 68)}%` }} />
                  ))}
                </div>
                <div className="da-track">
                  <span>00:00</span><i /><span>23:14</span><i /><span>61:30</span>
                </div>
                <div className="da-segs">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <span key={i} className={i === 6 ? "cur" : ""}>{`S${i + 5}`}</span>
                  ))}
                </div>
                <div className="da-prog"><i /></div>
                <div className="da-prog-label">Aligning speech · slides · photos … <b>100%</b></div>
              </div>

              {/* STEP 2 — Study */}
              <div className="da-pane da-study">
                <div className="da-col da-slides">
                  <div className="da-h">Slides</div>
                  <div className="da-thumb" data-hit="slide"><i style={{ width: "64%" }} /><i style={{ width: "82%" }} /></div>
                  <div className="da-thumb cur"><i style={{ width: "78%" }} /><i style={{ width: "56%" }} /></div>
                  <div className="da-thumb"><i style={{ width: "52%" }} /><i style={{ width: "70%" }} /></div>
                </div>
                <div className="da-col da-note">
                  <div className="da-h">Note — Week 11</div>
                  <b className="da-note-t">B-Tree insertion</b>
                  <i className="da-ln" style={{ width: "94%" }} />
                  <i className="da-ln" style={{ width: "80%" }} />
                  <i className="da-ln hl" style={{ width: "66%" }} />
                  <div className="da-frm">gˢ = yᶜ·β → O(log n)</div>
                  <i className="da-ln" style={{ width: "86%" }} />
                </div>
                <div className="da-col da-ask">
                  <div className="da-h">Ask</div>
                  <div className="da-q" data-hit="ask">Why split at the median?</div>
                  <div className="da-a">Both nodes stay half-full, so inserts stay balanced.<span className="da-cite">S12 · 23:14</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* autoplay: 탭을 스테이지 안(고정 크기) */}
          {mode === "autoplay" && tabsEl}
        </div>

        {/* scrub: 탭을 핀에 고정 → 스테이지가 확대돼도 뷰포트 우측에 유지 */}
        {mode === "scrub" && tabsEl}

        {/* 커서 (검은 화살표) — .demo-pin 자식(스케일 영향 안 받음) */}
        <svg className="demo-cursor" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path d="M5 3l14 8-6 1.5L10 20 5 3z" fill="#111" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
