/* ================================================================
   LiveDemo — 가이드 데모 섹션 (밝은 캔버스)
   큰 문구 → 소프트 그라데이션 위 Lectra 앱 목업이 업로드→정렬→학습으로
   변신하고, 손(장갑) 커서가 움직이며 클릭 시연.

   mode:
   - "autoplay" (기본) Harvest(getharvest.com) 히어로 비디오 문법:
                고정 프레임 안에서 "카메라"가 앱 UI를 줌인/줌아웃·팬 하고,
                손 커서가 클릭하면 실제 상태가 바뀌는 제품 투어 루프.
   - "scrub"    (A) 섹션을 핀 고정, 스크롤하면 목업이 열리며 화면을 채우고
                커서·단계가 스크롤 진행도에 맞춰 진행. (Krepling 방식)
   화면 밖이면 정지, prefers-reduced-motion이면 정적(Study).
   ================================================================ */
import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEPS = ["Library", "Lectures", "Workspace"] as const;
/* 단계별 주소창 텍스트 — 실제 라우트와 일치 */
const STEP_URLS = ["lectra.app/library", "lectra.app/library?folder=AI 시스템 설계", "lectra.app/lecture/ai04"] as const;
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

    const urlEl = root.querySelector<HTMLElement>(".da-url");
    const setStep = (i: number) => {
      app.setAttribute("data-step", String(i));
      tabs.forEach((t, ti) => t.classList.toggle("active", ti === i));
      if (urlEl) urlEl.textContent = STEP_URLS[i];
    };
    /* 손 커서 핫스팟(SVG 좌표의 손끝) — 이 점이 타겟 위에 놓인다 */
    const HOT = { x: 16, y: 3 };
    /* 대상 중심 좌표. 기준(ref) = 커서의 offsetParent:
       scrub → .demo-pin (스테이지 스케일 영향 회피)
       autoplay → .demo-stage (sticky 핀 중에도 함께 움직여 드리프트 없음) */
    const refBox = mode === "scrub" ? pin : stage;
    const center = (sel: string, dx = 0, dy = 0) => {
      const ref = refBox.getBoundingClientRect();
      const el = root.querySelector<HTMLElement>(sel);
      if (!el) return { x: ref.width / 2, y: ref.height / 2 };
      const r = el.getBoundingClientRect();
      return { x: r.left - ref.left + r.width / 2 - HOT.x + dx, y: r.top - ref.top + r.height / 2 - HOT.y + dy };
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
        { t: 0.0, get: at(".dlf-ai", 0, -8) },
        { t: 0.24, get: at(".dlf-ai", 0, -8), click: ".dlf-ai" },
        { t: 0.52, get: at(".dlc-ai04"), click: ".dlc-ai04" },
        { t: 0.76, get: at(".dw-tab-chat"), click: ".dw-tab-chat" },
        { t: 0.96, get: at(".dw-q") },
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

    /* ---------------- AUTOPLAY (기본) ----------------
       Krepling Storefront식: 헤딩이 스크롤 연동으로 페이드인(측정값 ~270px 구간)
       → 풀블리드 패널이 올라오며 살짝 settle(스케일 0.96→1)
       → 핀 고정된 채 아래 타임라인이 자동 재생. 레이아웃은 landing.css 참고 */
    const leadFade = lead
      ? gsap.fromTo(lead, { autoAlpha: 0, y: 36 }, {
          autoAlpha: 1, y: 0, ease: "none",
          scrollTrigger: { trigger: lead, start: "top 80%", end: "top 46%", scrub: true },
        })
      : null;
    /* 확!! 확대 — Krepling의 "콘텐츠 폭 → 풀블리드" 점프 재현: 0.62에서 시작해
       풀블리드로 인플레이트. origin은 top-center: 패널 상단이 헤딩 밑에 붙은 채
       아래·옆으로 팽창(중앙 origin이면 시작 시 상단이 밀려 간격이 벌어짐) */
    const stageSettle = gsap.fromTo(stage, { scale: 0.62 }, {
      scale: 1, ease: "none", transformOrigin: "50% 0%",
      scrollTrigger: { trigger: stage, start: "top 96%", end: "top 22%", scrub: true },
    });

    /* ── Harvest식 카메라 리그 ──────────────────────────────────
       카메라 = .demo-app 전체(크롬 포함)를 origin(0,0) 기준 scale+translate.
       줌인하면 앱이 스테이지(overflow:hidden)를 넘치며 크롭 — 비디오의 줌 샷.
       좌표는 rect가 아니라 레이아웃(offset 체인)에서 해석적으로 계산 →
       카메라가 움직이는 중에도 커서 목적지가 정확하다. */
    const chat = root.querySelector<HTMLElement>(".dw-chat");
    const folderIs = root.querySelector<HTMLElement>(".dlf-ai");
    const cardZkp = root.querySelector<HTMLElement>(".dlc-ai04");
    const chatTab = root.querySelector<HTMLElement>(".dw-tab-chat");
    const sumTab = root.querySelector<HTMLElement>(".dw-tabs i.on");

    /* 앱-로컬(무변환) 좌표: offsetParent 체인을 app까지 누적 */
    const localCenter = (sel: string) => {
      const el = root.querySelector<HTMLElement>(sel);
      if (!el) return { x: app.offsetWidth / 2, y: app.offsetHeight / 2 };
      let x = 0, y = 0, n: HTMLElement | null = el;
      while (n && n !== app) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
      return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
    };
    /* 카메라 상태: sel 중심이 스테이지 중앙에 오도록 하는 scale+translate */
    const camFor = (sel: string | null, z: number) => {
      if (!sel) return { z: 1, x: 0, y: 0 };
      const p = localCenter(sel);
      return {
        z,
        x: stage.clientWidth / 2 - app.offsetLeft - z * p.x,
        y: stage.clientHeight / 2 - app.offsetTop - z * p.y,
      };
    };
    const camTo = (sel: string | null, z: number) => ({
      scale: z,
      x: () => camFor(sel, z).x,
      y: () => camFor(sel, z).y,
    });
    /* 커서 목표(스테이지-로컬): 카메라 "끝 상태"를 수식으로 반영 */
    const curTo = (tSel: string, camSel: string | null, z: number, dx = 0, dy = 0) => ({
      x: () => { const c = camFor(camSel, z); return app.offsetLeft + c.x + c.z * localCenter(tSel).x + dx - HOT.x; },
      y: () => { const c = camFor(camSel, z); return app.offsetTop + c.y + c.z * localCenter(tSel).y + dy - HOT.y; },
    });
    /* 손 커서 press 제스처(손끝 기준 눌림) + 대상 hit */
    const press = (hitSel?: string) => {
      gsap.timeline()
        .to(cursor, { scale: 0.84, duration: 0.1, ease: "power2.in", transformOrigin: "47% 8%" })
        .to(cursor, { scale: 1, duration: 0.24, ease: "back.out(2.5)" });
      if (hitSel) {
        const h = root.querySelector<HTMLElement>(hitSel);
        if (h) { h.classList.add("hit"); window.setTimeout(() => h.classList.remove("hit"), 300); }
      }
    };

    gsap.set(app, { transformOrigin: "0 0" });
    let tl: ReturnType<typeof gsap.timeline> | null = null;
    const build = () => {
      tl?.kill();
      setStep(0);
      gsap.set(app, { scale: 1, x: 0, y: 0 });
      const resetLoop = () => {
        setStep(0);
        folderIs?.classList.remove("open", "hov");
        cardZkp?.classList.remove("hov");
        chatTab?.classList.remove("on");
        sumTab?.classList.add("on");
        if (chat) gsap.set(chat, { autoAlpha: 0, x: 18 });
      };
      tl = gsap.timeline({
        repeat: -1, repeatDelay: 1.0, repeatRefresh: true, paused: true,
        defaults: { ease: "power3.inOut" }, onRepeat: resetLoop,
      });
      const CAM = 1.15; // 카메라 이동 기본 시간(초)

      // ⓪ 오버뷰: /library 폴더 그리드, 커서 등장
      tl.call(resetLoop, undefined, 0.001)
        .set(app, { scale: 1, x: 0, y: 0 }, 0)
        .set(cursor, { scale: 1, opacity: 0, ...curTo(".dl-grid", null, 1, 0, 46) }, 0)
        .to(cursor, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0.15);

      // ① 폴더 그리드로 줌인 — 정보보호이론 폴더에 hover → 열림 → 클릭
      tl.to(app, { ...camTo(".dl-grid", 1.35), duration: CAM }, 0.55)
        .to(cursor, { ...curTo(".dlf-ai", ".dl-grid", 1.35, 2, -4), duration: CAM }, "<")
        .call(() => folderIs?.classList.add("hov"), undefined, ">-0.1")
        .call(() => { folderIs?.classList.remove("hov"); folderIs?.classList.add("open"); }, undefined, ">+0.35")
        .to({}, { duration: 0.55 }, ">")
        .call(() => press(".dlf-ai"), undefined, ">");

      // ② 폴더 상세(/library?folder=…)로 전환 — 강의 카드로 이동
      tl.call(() => setStep(1), undefined, ">+0.25")
        .to(app, { ...camTo(null, 1), duration: 0.9 }, "<")
        .to(cursor, { ...curTo(".dlc-ai04", null, 1, 0, -6), duration: 0.9 }, "<");
      // Ready 강의(06. Zero-Knowledge Proofs) 카드로 줌인 → hover lift → 클릭
      tl.to(app, { ...camTo(".dlc-ai04", 1.4), duration: 1.05 }, ">+0.15")
        .to(cursor, { ...curTo(".dlc-ai04", ".dlc-ai04", 1.4, 4, 6), duration: 1.05 }, "<")
        .call(() => cardZkp?.classList.add("hov"), undefined, ">-0.05")
        .to({}, { duration: 0.35 }, ">")
        .call(() => press(".dlc-ai04"), undefined, ">");

      // ③ 워크스페이스(/lecture/w10)로 전환 — 노트 요약으로 줌인
      tl.call(() => setStep(2), undefined, ">+0.25")
        .to(app, { ...camTo(null, 1), duration: 0.95 }, "<")
        .to(cursor, { ...curTo(".dw-note", null, 1, 0, -10), duration: 0.95 }, "<");
      tl.to(app, { ...camTo(".dw-note-hot", 1.5), duration: CAM }, ">+0.15")
        .to(cursor, { ...curTo(".dw-note-hot", ".dw-note-hot", 1.5, 40, 30), duration: CAM }, "<")
        .to({}, { duration: 0.45 }, ">");

      // ④ 레퍼런스 패널로 팬 — 챗봇 탭 클릭 → 우측 패널 전체가 챗봇 화면으로 전환 (RAG)
      tl.to(app, { ...camTo(".dw-chat", 1.45), duration: 1.0 }, ">")
        .to(cursor, { ...curTo(".dw-tab-chat", ".dw-chat", 1.45), duration: 1.0 }, "<")
        .call(() => press(".dw-tab-chat"), undefined, ">")
        .call(() => { sumTab?.classList.remove("on"); chatTab?.classList.add("on"); }, undefined, ">+0.1");
      if (chat) tl.to(chat, { autoAlpha: 1, x: 0, duration: 0.45, ease: "power2.out" }, ">+0.05");
      tl.to({}, { duration: 0.9 }, ">");

      // ⑤ 줌아웃 — 전체 워크스페이스, 커서는 재생 버튼으로 (Ready ✓)
      tl.to(app, { ...camTo(null, 1), duration: 1.05 }, ">")
        .to(cursor, { ...curTo(".dw-play", null, 1, 3, 0), duration: 1.05 }, "<")
        .call(() => press(), undefined, ">")
        .to({}, { duration: 1.35 }, ">");

      (window as unknown as { __demoTl?: unknown }).__demoTl = tl; // 검증용
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
    return () => {
      window.removeEventListener("resize", onResize); window.clearTimeout(rt);
      st.kill(); tl?.kill();
      leadFade?.scrollTrigger?.kill(); leadFade?.kill();
      stageSettle.scrollTrigger?.kill(); stageSettle.kill();
      gsap.set([app, cursor, ...(chat ? [chat] : [])], { clearProps: "all" });
    };
  }, [mode]);

  /* 커서 (Harvest식 흰 장갑 손) — 손끝(16,3)이 핫스팟. 배치는 모드별: autoplay=stage 안 / scrub=pin */
  const cursorEl = (
    <svg className="demo-cursor" viewBox="0 0 33 38" width="34" height="39" aria-hidden="true">
      <path
        d="M13.8 4.2c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7v10.9l5.2 1c3.7.7 6.3 3.9 6.3 7.6 0 .9-.2 1.9-.5 2.8l-1.3 3.5c-1 2.8-3.7 4.6-6.6 4.6h-4.8c-2.3 0-4.5-1.1-5.9-2.9l-5.8-7.6c-.9-1.1-.8-2.7.3-3.7 1.1-1 2.8-1 3.8.1l2.9 3V4.2Z"
        fill="#fff" stroke="#111" strokeWidth="1.7" strokeLinejoin="round"
      />
      <path d="M19.2 15.4v5.8M24.2 16.4v4.9" stroke="#111" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );

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
              <span className="da-badge da-badge-done">Ready ✓</span>
            </div>

            <div className="da-body">
              {/* 다크 사이드바 — 실제 AppShell 미니어처 (landingpage ex 기준, 스텝 공통) */}
              <div className="da-side">
                <b className="ds-logo">Lectra</b>
                <span className="ds-new">＋ 새 강의 만들기</span>
                <span className="ds-search">⌕ 검색 (제목 또는 내용)</span>
                <small className="ds-cap">메뉴</small>
                <span className="ds-item ds-all">▦ 전체 강의<i>12</i></span>
                <small className="ds-cap">최근</small>
                <span className="ds-item ds-ai04">04. Designing Reli…<i className="dot">●</i></span>
                <span className="ds-item">03. Prompt Enginee…<i className="dot">●</i></span>
                <span className="ds-item">02. Machine Learni…<i className="dot">●</i></span>
                <small className="ds-cap">과목</small>
                <span className="ds-item ds-ai">▸ AI 시스템 설계<i>4</i></span>
                <span className="ds-item">▸ 데이터 사이언스<i>3</i></span>
                <span className="ds-item">▸ 소프트웨어 공학<i>2</i></span>
                <span className="ds-item">▸ 운영체제<i>3</i></span>
                <span className="ds-user"><i>F</i>focusstation<small>Pro 플랜</small></span>
              </div>

              <div className="da-main">
                {/* STEP 0 — /library 과목 폴더 그리드 (ex 기준 과목 구성) */}
                <div className="da-pane dl-library">
                  <div className="dl-head">
                    <div className="dl-title"><b>전체 강의</b><small>과목 4개 · 강의 12개</small></div>
                    <span className="dl-upbtn">↥ Upload</span>
                  </div>
                  <div className="dl-grid">
                    <div className="dlf dlf-ai" style={{ "--fc": "#EAB308", "--fb": "#D7A50B" } as CSSProperties}>
                      <span className="dlf-icon">
                        <i className="tab" /><i className="back" />
                        <i className="pp p1" /><i className="pp p2" /><i className="pp p3" />
                        <i className="ff f1" /><i className="ff f2" />
                      </span>
                      <b>AI 시스템 설계</b><small>강의 4개 · 최근 수정 Jul 7</small>
                    </div>
                    <div className="dlf" style={{ "--fc": "#94A13C", "--fb": "#879437" } as CSSProperties}>
                      <span className="dlf-icon">
                        <i className="tab" /><i className="back" />
                        <i className="pp p1" /><i className="pp p2" /><i className="pp p3" />
                        <i className="ff f1" /><i className="ff f2" />
                      </span>
                      <b>데이터 사이언스</b><small>강의 3개 · 최근 수정 Jul 5</small>
                    </div>
                    <div className="dlf" style={{ "--fc": "#7DD3FC", "--fb": "#6FC2EC" } as CSSProperties}>
                      <span className="dlf-icon">
                        <i className="tab" /><i className="back" />
                        <i className="pp p1" /><i className="pp p2" /><i className="pp p3" />
                        <i className="ff f1" /><i className="ff f2" />
                      </span>
                      <b>소프트웨어 공학</b><small>강의 2개 · 최근 수정 Jul 3</small>
                    </div>
                    <div className="dlf" style={{ "--fc": "#C3ABEB", "--fb": "#B29ADF" } as CSSProperties}>
                      <span className="dlf-icon">
                        <i className="tab" /><i className="back" />
                        <i className="pp p1" /><i className="pp p2" /><i className="pp p3" />
                        <i className="ff f1" /><i className="ff f2" />
                      </span>
                      <b>운영체제</b><small>강의 3개 · 최근 수정 Jul 1</small>
                    </div>
                  </div>
                </div>

                {/* STEP 1 — /library?folder=… 강의 카드 (ex 과목: AI 시스템 설계) */}
                <div className="da-pane dl-folder">
                  <div className="dl-head">
                    <div className="dl-title">
                      <small className="dl-back">‹ 전체 과목</small>
                      <b>AI 시스템 설계</b><small>강의 4개 · 최근 수정 Jul 7</small>
                    </div>
                    <div className="dl-actions"><span className="dl-sort">⇅ 최근 수정순</span><span className="dl-upbtn">↥ Upload</span></div>
                  </div>
                  <div className="dlc-grid">
                    <div className="dlc dlc-ai04">
                      <span className="dlc-thumb"><img src="/demo/exs-1.png" alt="" loading="lazy" /></span>
                      <b>04. Designing Reliable AI Systems</b>
                      <small>AI 시스템 설계 · Jul 7 · 슬라이드 26장</small>
                      <span className="chip chip-ready">Ready</span>
                    </div>
                    <div className="dlc">
                      <span className="dlc-thumb"><img src="/demo/exs-3.png" alt="" loading="lazy" /></span>
                      <b>03. Prompt Engineering</b>
                      <small>AI 시스템 설계 · Jul 5 · 슬라이드 22장</small>
                      <span className="chip chip-ready">Ready</span>
                    </div>
                    <div className="dlc">
                      <span className="dlc-thumb"><img src="/demo/exs-4.png" alt="" loading="lazy" /></span>
                      <b>02. Machine Learning Basics</b>
                      <small>AI 시스템 설계 · Jul 2 · 슬라이드 28장</small>
                      <span className="chip chip-ready">Ready</span>
                    </div>
                  </div>
                </div>

                {/* STEP 2 — /lecture/ai04: landingpage ex 화면을 통짜 이미지로 그대로 사용.
                    보이지 않는 핫스팟(.dw-tab-chat/.dw-note-hot)으로 카메라·클릭 좌표를 잡고,
                    챗봇 탭 클릭 시 우측 패널 영역 전체가 DOM 챗봇 화면으로 전환된다. */}
                <div className="da-pane dw-work">
                  <div className="dw-shot">
                    <img className="dw-full" src="/demo/exw-main.png" alt="" loading="lazy" />
                    <i className="dw-note-hot" aria-hidden="true" />
                    <i className="dw-tab-chat" aria-hidden="true" />
                    <div className="dw-chat" aria-hidden="true">
                      <b className="dw-chat-h">💬 챗봇<i>이 강의 자료에서만 답해요</i></b>
                      <span className="dw-q">견고성과 정확성은 뭐가 다른가요?</span>
                      <span className="dw-a">정확성은 목표 지표에서의 예측 성능이고, 견고성은 데이터가 변하거나 노이즈가 섞여도 일관되게 작동하는 안정성이에요.<i className="dw-cite">S2 · 06:42</i></span>
                      <span className="dw-q">시험에 나올 포인트는?</span>
                      <span className="dw-a">네 가지 원칙의 정의 비교와, 신뢰성 설계 프레임워크 5단계의 순서·피드백 루프가 핵심이에요.<i className="dw-cite">S3 · 12:05</i></span>
                      <span className="dw-inp">질문을 입력하세요…<i>➤</i></span>
                    </div>
                  </div>
                  <div className="dw-timeline">
                    <i className="dw-play">▶</i>
                    <small className="dw-time">06:42 / 49:18</small>
                    <small className="dw-speed">1.25×</small>
                    <span className="dw-segs">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <i key={i} className={i < 2 ? "fill" : ""} />
                      ))}
                      <b className="dw-marker">1-1</b>
                    </span>
                    <span className="dw-extra">
                      <i className="dw-xbtn">🔖 북마크</i>
                      <i className="dw-xbtn">⟳ 구간 반복</i>
                      <i className="dw-vol" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* autoplay: 탭·커서를 스테이지 안에 → sticky 핀 중에도 함께 움직임(드리프트 방지) */}
          {mode === "autoplay" && (
            <>
              {tabsEl}
              {cursorEl}
            </>
          )}
        </div>

        {/* scrub: 탭·커서를 핀에 고정 → 스테이지가 확대돼도 스케일 영향 없음 */}
        {mode === "scrub" && (
          <>
            {tabsEl}
            {cursorEl}
          </>
        )}
      </div>
    </section>
  );
}
