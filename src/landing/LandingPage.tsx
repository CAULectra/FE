/* ================================================================
   LandingPage — 정적 v4 랜딩의 React 포팅 (한 코드베이스 통합)
   구조·카피·애니메이션은 v4와 동일. 인터랙션은 useLandingEffects,
   히어로 3D는 SplineHero, 도트 배경은 react-bits DotField.
   ================================================================ */
import React, { useRef } from "react";
import { useNavigate } from "react-router";
import DotField from "./DotField";
import SplineHero from "./SplineHero";
import { useLandingEffects } from "./useLandingEffects";
import "./landing.css";

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useLandingEffects(rootRef);

  /* 내부 링크(/auth, /library, /lecture/…)는 SPA 네비게이션으로 */
  const onRootClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    if (href && (href === "/auth" || href === "/library" || href.startsWith("/lecture/"))) {
      e.preventDefault();
      navigate(href);
    }
  };

  return (
    <div ref={rootRef} className="landing-root" onClick={onRootClick}>
      
      
      {/* ================= BOTTOM DOCK NAV ================= */}
      <nav className="dock" id="dock">
        <button className="dock-home" id="dock-home" title="맨 위로">⌂</button>
        <div className="dock-links">
          <div className="dock-item">
            <button className="dock-link">Product <span className="chev">▼</span></button>
            <div className="dropup">
              <a href="/lecture/w10">Workspace <small>동기화 노트 · Q&A · 번역</small></a>
              <a href="/library">Library <small>폴더 · 검색 · 처리 현황</small></a>
              <a href="#walkthrough">How it works <small>5단계 워크스루</small></a>
              <a href="#calc">Calculator <small>시간 절약 계산기</small></a>
            </div>
          </div>
          <a className="dock-link" href="/library">Workspace ↗</a>
          <div className="dock-item">
            <button className="dock-link">Company <span className="chev">▼</span></button>
            <div className="dropup">
              <a href="mailto:focustationcapstone@gmail.com">Team contact</a>
              <a href="#calc">Fees</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </nav>
      <a className="support-pill" href="mailto:focustationcapstone@gmail.com">💬 Support</a>
      
      <main id="top">
      
      {/* ================= HERO ================= */}
      <section className="hero" id="hero">
        <div className="sticky-slot">
          <div className="hero-bg spline-on"><div className="hb hb1"></div><div className="hb hb2"></div><div className="hb hb3"></div></div>
          <SplineHero />
          <div className="hero-vignette"></div>
          <div className="hero-grain"></div>
          <div className="top-nav">
            <a className="logo" href="#top">Lectra</a>
            <div className="nav-right">
              <button className="lang-btn">🌐 KO <span style={{fontSize: '9px', opacity: '.7'} as React.CSSProperties}>▼</span></button>
              <a className="login-btn" href="/auth">Log in</a>
              <a className="signup-btn" href="/auth">Sign up</a>
            </div>
          </div>
          <div className="stage">
            <h1 className="hero-title t-display" id="hero-title">One app<br />for every lecture</h1>
            <aside className="hero-aside">
              <p>Single workspace<br />for all your lectures.</p>
              <div className="app-badges">
                <a className="_app-button" href="/auth"><span className="outline"></span><span>🌐</span><span><small>지금 바로</small><b>Web App</b></span></a>
                <a className="_app-button" href="#"><span className="outline"></span><span></span><span><small>곧 출시</small><b>App Store</b></span></a>
              </div>
            </aside>
          </div>
          <div className="taglines" id="taglines">
            <div className="tagline tl-slides">
              <div className="icon-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/></svg></div>
              <h3>Slides</h3>
            </div>
            <div className="tagline tl-audio">
              <div className="icon-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg></div>
              <h3>Audio recordings</h3>
            </div>
            <div className="tagline tl-images">
              <div className="icon-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4-4-8 8"/></svg></div>
              <h3>Images</h3>
            </div>
          </div>
          <button className="scroll-ind" id="scroll-ind"><i>↓</i> Scroll</button>
        </div>
      </section>
      
      {/* ================= WALKTHROUGH (pinned) ================= */}
      <section className="walkthrough" id="walkthrough">
        <div className="wt-dots">
          <DotField
            dotRadius={1.5}
            dotSpacing={14}
            bulgeStrength={67}
            glowRadius={160}
            sparkle={false}
            waveAmplitude={0}
            cursorRadius={300}
            cursorForce={0.1}
            bulgeOnly
            gradientFrom="#ffffff"
            gradientTo="#B497CF"
            glowColor="#120F17"
          />
        </div>
        <div className="wt-pin" id="wt-pin">
          <div className="wt-heading">
            <div className="line" id="wt-line">
              <span>Drop in your slides.</span>
              <span>Add the recording.</span>
              <span>Photos? Auto-placed.</span>
              <span>We align every sentence.</span>
              <span>Your workspace is ready.</span>
            </div>
            <div className="wt-sub" id="wt-sub">PDF·PPT 슬라이드가 강의의 뼈대가 됩니다</div>
          </div>
      
          <div className="browser" id="wt-browser" data-step="0">
            <div className="chrome"><span className="dots"><i></i><i></i><i></i></span><span className="url" id="wt-url">lectra.app/upload</span><span style={{width: '45px'} as React.CSSProperties}></span></div>
            <div className="app">
              <aside className="mini-side">
                <div className="logo">Lectra</div>
                <div className="newbtn">+ New lecture</div>
                <div className="cap">Library</div>
                <div className="mrow on"><span className="ic"></span><span className="lb" style={{maxWidth: '52px'} as React.CSSProperties}></span></div>
                <div className="cap">Subjects</div>
                <div className="mrow srow srow1"><span className="fdot" style={{background: '#DF7A55'} as React.CSSProperties}></span><span className="lb" style={{maxWidth: '64px'} as React.CSSProperties}></span><span className="sdot"></span></div>
                <div className="mrow srow"><span className="fdot" style={{background: '#E0A23E'} as React.CSSProperties}></span><span className="lb" style={{maxWidth: '46px'} as React.CSSProperties}></span><span className="sdot"></span></div>
                <div className="mrow srow"><span className="fdot" style={{background: '#A99677'} as React.CSSProperties}></span><span className="lb" style={{maxWidth: '56px'} as React.CSSProperties}></span><span className="sdot"></span></div>
              </aside>
              <div className="stage">
              {/* 01 Slides */}
              <div className="screen on" data-step="0">
                <div className="mini-modal">
                  <div className="mm-title">New lecture</div>
                  <div className="drop-tile ok"><span>lecture_slides.pdf<span className="sm">4.2 MB — 검증 통과</span></span><b style={{color: 'var(--emerald)'} as React.CSSProperties}>✓</b></div>
                  <div className="drop-tile">+ PDF / PPT<span className="sm">슬라이드가 노트의 뼈대가 됩니다</span></div>
                </div>
              </div>
              {/* 02 Audio */}
              <div className="screen" data-step="1">
                <div className="mini-modal">
                  <div className="mm-title">Add the recording</div>
                  <div className="wave"><i style={{'--h': '60%'} as React.CSSProperties}></i><i style={{'--h': '85%'} as React.CSSProperties}></i><i style={{'--h': '45%'} as React.CSSProperties}></i><i style={{'--h': '95%'} as React.CSSProperties}></i><i style={{'--h': '55%'} as React.CSSProperties}></i><i style={{'--h': '75%'} as React.CSSProperties}></i><i style={{'--h': '40%'} as React.CSSProperties}></i><i style={{'--h': '90%'} as React.CSSProperties}></i><i style={{'--h': '65%'} as React.CSSProperties}></i><i style={{'--h': '80%'} as React.CSSProperties}></i><i style={{'--h': '50%'} as React.CSSProperties}></i><i style={{'--h': '70%'} as React.CSSProperties}></i></div>
                  <div className="drop-tile ok"><span>lecture_recording.mp3<span className="sm">58 MB · 61:30</span></span><b style={{color: 'var(--cobalt)'} as React.CSSProperties}>✓</b></div>
                </div>
              </div>
              {/* 03 Photos */}
              <div className="screen" data-step="2">
                <div className="mini-modal">
                  <div className="mm-title">Photos, auto-placed</div>
                  <div className="photo-grid">
                    <div className="photo-cell">📷<span className="stamp">23:40</span></div>
                    <div className="photo-cell">📷<span className="stamp">36:50</span></div>
                    <div className="photo-cell">📷<span className="stamp">48:12</span></div>
                    <div className="photo-cell" style={{border: '1.5px dashed var(--sand)', background: 'none', color: 'var(--sand)'} as React.CSSProperties}>＋</div>
                  </div>
                </div>
              </div>
              {/* 04 Aligning */}
              <div className="screen" data-step="3">
                <div className="mini-page">
                  <div className="mm-title">Aligning…</div>
                  <div className="pipe-row done"><span className="n">✓</span>업로드 수신<span className="pct">done</span></div>
                  <div className="pipe-row done"><span className="n">✓</span>STT 음성 인식<span className="pct">done</span></div>
                  <div className="pipe-row done"><span className="n">✓</span>슬라이드 텍스트 추출<span className="pct">done</span></div>
                  <div className="pipe-row cur"><span className="n">4</span>슬라이드-스크립트 정렬<span className="pct">72%</span></div>
                  <div className="pipe-row"><span className="n">5</span>AI 노트 생성<span className="pct">대기</span></div>
                  <div className="wt-prog"><i></i></div>
                  <div className="wt-prog-lb">Overall 72% — 페이지를 떠나도 계속돼요</div>
                </div>
              </div>
              {/* 05 Workspace */}
              <div className="screen" data-step="4">
                <div className="mini-study">
                  <div className="ms-col ms-slides"><div className="ms-h">Slides</div>
                    <div className="ms-thumb"><div className="tl1"></div><div className="tl2"></div></div>
                    <div className="ms-thumb cur"><div className="tl1" style={{width: '78%'} as React.CSSProperties}></div><div className="tl2"></div></div>
                    <div className="ms-thumb"><div className="tl1" style={{width: '52%'} as React.CSSProperties}></div><div className="tl2" style={{width: '70%'} as React.CSSProperties}></div></div>
                  </div>
                  <div className="ms-col ms-note"><div className="ms-h">Note</div>
                    <div className="nh"></div>
                    <div className="ln" style={{width: '94%'} as React.CSSProperties}></div><div className="ln" style={{width: '80%'} as React.CSSProperties}></div>
                    <div className="ln hl"></div>
                    <div className="frm">gˢ = yᶜ·β  →  O(log n)</div>
                    <div className="ln" style={{width: '86%'} as React.CSSProperties}></div><div className="ln" style={{width: '58%'} as React.CSSProperties}></div>
                  </div>
                  <div className="ms-col ms-chat"><div className="ms-h">Ask</div>
                    <div className="ms-bub q">왜 중앙값으로 분할해?</div>
                    <div className="ms-bub a">양쪽 노드가 반씩 차서 삽입 여유가 균등해져요.<br /><span className="cite">S12 · 23:14</span></div>
                  </div>
                </div>
                <div className="mini-tl"><span className="play">▶</span><span className="tlt">23:14 / 61:30</span><span className="segs"><i className="done"></i><i className="done"></i><i className="done"></i><i className="cur"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>
              </div>
              </div>{/* /stage */}
            </div>{/* /app */}
          </div>{/* /browser */}
      
          <div className="stepper" id="stepper">
            <button className="step-btn active" data-i="0"><span className="index">01</span><span className="label">Slides</span><span className="bar"><i></i></span></button>
            <button className="step-btn" data-i="1"><span className="index">02</span><span className="label">Audio</span><span className="bar"><i></i></span></button>
            <button className="step-btn" data-i="2"><span className="index">03</span><span className="label">Photos</span><span className="bar"><i></i></span></button>
            <button className="step-btn" data-i="3"><span className="index">04</span><span className="label">Align</span><span className="bar"><i></i></span></button>
            <button className="step-btn" data-i="4"><span className="index">05</span><span className="label">Ready</span></button>
          </div>
          <div className="restart-wrap"><button className="restart-btn roll-host" id="restart" data-roll>⟲ Restart</button></div>
        </div>
      </section>
      
      {/* ================= APP HERO ================= */}
      <section className="app-hero" id="app-hero">
        <div className="bg"><div className="blob b1"></div><div className="blob b2"></div></div>
        <div className="float-card fc1">이번 주 강의 3개 정렬 완료 ✓</div>
        <div className="float-card fc2">Week 11 — Hashing<br /><span style={{opacity: '.7', fontSize: '11px'} as React.CSSProperties}>Processing 45% · ETA 6분</span></div>
        <div className="wrap content">
          <h2 className="t3">All your lectures,<br />in one app.</h2>
          <p className="sub sub2">업로드부터 시험 전날 복습까지 — 폴더, 검색, 처리 현황, 워크스페이스가 한곳에.</p>
          <a className="_button fill-white pill" href="/library" data-roll>Get Started</a>
          <div className="app-badges">
            <a className="_app-button" href="/auth"><span className="outline"></span><span>🌐</span><span><small>지금 바로</small><b>Web App</b></span></a>
            <a className="_app-button" href="#"><span className="outline"></span><span></span><span><small>곧 출시</small><b>App Store</b></span></a>
            <a className="_app-button" href="#"><span className="outline"></span><span>▶</span><span><small>곧 출시</small><b>Google Play</b></span></a>
          </div>
        </div>
      </section>
      
      {/* ================= WORKSPACE OVERVIEW ================= */}
      <section className="overview" id="overview">
        <div className="wrap head">
          <span className="_tag" style={{color: 'var(--orange)'} as React.CSSProperties}><span className="outline"></span>Workspace</span>
          <h2 className="t5" style={{marginTop: '16px'} as React.CSSProperties}>Lectra Workspace:<br />your go-to for every exam.</h2>
        </div>
        <div className="ov-panel reveal">
          <div className="ov-inner">
            <div className="ov-col">
              <div className="ov-label">Slides</div>
              <div className="ready-slide"><div className="st">S11 — Insertion</div><div className="ln" style={{width: '75%'} as React.CSSProperties}></div><div className="ln" style={{width: '55%'} as React.CSSProperties}></div></div>
              <div className="ready-slide cur"><div className="st">S12 — B-Tree insertion</div><div className="ln" style={{width: '70%'} as React.CSSProperties}></div><div className="ln" style={{width: '82%'} as React.CSSProperties}></div></div>
              <div className="ready-slide"><div className="st">S13 — Split example</div><div className="ln" style={{width: '60%'} as React.CSSProperties}></div><div className="ln" style={{width: '45%'} as React.CSSProperties}></div></div>
            </div>
            <div className="ov-col">
              <div className="ov-label">My notes</div>
              <div className="karaoke"><span className="ts">S12</span><b style={{fontWeight: '500'} as React.CSSProperties}>B-Tree insertion — 23:14</b></div>
              <div className="karaoke">노드가 가득 차면 중앙값 기준 분할</div>
              <div className="karaoke on">중앙값은 부모로 승격 — 높이 로그 유지</div>
              <div className="karaoke">📷 23:40 필기 사진 — 자동 삽입</div>
              <div className="karaoke" style={{color: 'var(--orange)'} as React.CSSProperties}>내 질문: 왜 하필 중앙값? → Q&A</div>
            </div>
            <div className="ov-col">
              <div className="ov-label">Q&A</div>
              <div className="karaoke" style={{background: '#faf7f6', borderRadius: '10px'} as React.CSSProperties}>왜 중앙값으로 분할해?</div>
              <div className="karaoke" style={{fontSize: '11px', lineHeight: '1.5'} as React.CSSProperties}>양쪽 모두 최소 채움을 만족하는 유일한 분할점이라서요.</div>
              <div style={{marginTop: '6px'} as React.CSSProperties}><span className="caption" style={{color: 'var(--orange)', border: '1px solid var(--blush)', borderRadius: '9999px', padding: '3px 10px'} as React.CSSProperties}>S12 · 23:14</span></div>
            </div>
            <div className="ov-tl">
              <span className="ov-label" style={{margin: '0 8px 0 0'} as React.CSSProperties}>Timeline</span>
              <div className="seg done" style={{flex: '5'} as React.CSSProperties}></div><div className="seg done" style={{flex: '8'} as React.CSSProperties}></div><div className="seg cur" style={{flex: '6'} as React.CSSProperties}><i></i></div><div className="seg" style={{flex: '9'} as React.CSSProperties}></div><div className="seg" style={{flex: '7'} as React.CSSProperties}></div>
            </div>
          </div>
        </div>
        <div className="wrap ov-check reveal">
          <h3 className="t5">Karaoke highlight? Sure.<br />Cited answers? Check.<br />Heatmaps? Also check.</h3>
          <p>현재 문장 자동 하이라이트, 원문 인용 칩이 달린 Q&A, 교수님이 오래 머문 슬라이드를 보여주는 체류시간 히트맵까지 — 정렬 하나로 전부 따라옵니다.</p>
          <a className="link-orange roll-host" href="/lecture/w10" data-roll>Learn more →</a>
        </div>
      </section>
      
      {/* ================= CALCULATOR ================= */}
      <section className="calc" id="calc">
        <div className="head">
          <span className="_tag"><span className="outline"></span>Calculator</span>
          <h2 className="t3" style={{marginTop: '16px'} as React.CSSProperties}>Convert lectures<br />into minutes.</h2>
        </div>
        <div className="calc-box">
          <div className="_card">
            <div className="row1">
              <div className="_dropdown" id="dd-src">
                <button className="dd-btn"><span className="ic" style={{background: 'var(--cobalt)'} as React.CSSProperties}>🎧</span><span className="lbl">Lecture</span><span className="chev">▼</span></button>
                <div className="dd-list">
                  <button data-mult="1" data-label="Lecture"><span className="ic" style={{background: 'var(--cobalt)'} as React.CSSProperties}>🎧</span>Lecture<small>1개</small></button>
                  <button data-mult="3" data-label="Week"><span className="ic" style={{background: 'var(--emerald)'} as React.CSSProperties}>📅</span>Week<small>강의 3개</small></button>
                  <button data-mult="45" data-label="Semester"><span className="ic" style={{background: 'var(--coral)'} as React.CSSProperties}>🎓</span>Semester<small>강의 45개</small></button>
                </div>
              </div>
              <span className="caption" style={{color: 'var(--ash)'} as React.CSSProperties}>강의 길이</span>
            </div>
            <div className="amount"><input id="calc-in" type="text" inputMode="numeric" value="60" /><span className="unit">min</span></div>
          </div>
          <button className="swap-btn" id="swap" title="방향 바꾸기">⇅</button>
          <div className="_card">
            <div className="row1">
              <div className="dd-btn" style={{cursor: 'default'} as React.CSSProperties}><span className="ic" style={{background: 'var(--orange)'} as React.CSSProperties}>⚡</span><span id="out-label">Lectra 복습</span></div>
              <span className="caption" style={{color: 'var(--ash)'} as React.CSSProperties} id="out-cap">정렬 노트 기준</span>
            </div>
            <div className="out-val"><span id="calc-out">22</span> <small>min</small></div>
          </div>
        </div>
        <div className="calc-save" id="calc-save"><b>38분</b> 절약 — 2.7× 빠른 복습</div>
        <div className="calc-note">ⓘ 평균 정렬 노트 복습 속도 기준 · 데모 수치</div>
      </section>
      
      {/* ================= TESTIMONIALS (pinned stack) ================= */}
      <section className="testimonials" id="testimonials">
        <div className="tst-pin" id="tst-pin">
          <h2 className="t3">Hear it from students</h2>
          <div className="card-stack" id="card-stack">
            <div className="t-card">
              <p>"시험 전날 3배속으로 다시 듣던 걸 그만뒀어요. 히트맵에서 교수님이 15분 머문 슬라이드만 골라 보니까 복습이 22분에 끝나요."</p>
              <div className="who"><span className="avatar" style={{background: 'var(--mint)'} as React.CSSProperties}>JH</span><span>지현<small>컴퓨터공학 3학년</small></span></div>
            </div>
            <div className="t-card">
              <p>"필기 사진이 촬영 시각으로 노트에 자동 배치되는 게 진짜 편해요. 판서 놓친 날에도 친구 사진만 받으면 끝."</p>
              <div className="who"><span className="avatar" style={{background: 'var(--citrus)'} as React.CSSProperties}>MJ</span><span>민준<small>전자공학 2학년</small></span></div>
            </div>
            <div className="t-card">
              <p>"Q&A 답변에 인용 칩이 붙어서 원문을 바로 확인할 수 있어요. 챗봇 환각 때문에 불안했던 게 사라졌어요."</p>
              <div className="who"><span className="avatar" style={{background: '#ffd9d0'} as React.CSSProperties}>SY</span><span>서연<small>수학과 4학년</small></span></div>
            </div>
            <div className="t-card">
              <p>"영어 강의는 번역 탭으로 섹션마다 한국어를 깔아두고, 타임스탬프 그대로 점프하면서 들어요. 유학생 팀원한테도 공유했어요."</p>
              <div className="who"><span className="avatar" style={{background: '#d7e4ff'} as React.CSSProperties}>DK</span><span>도경<small>경영학 3학년</small></span></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ================= FINALE / FOOTER ================= */}
      <section className="finale" id="finale">
        <h2 className="t1 reveal">Ten thousand lectures,<br />plus yours.</h2>
        <p className="sub sub2 reveal">가입부터 첫 정렬 노트까지 5분. 시험공부의 기본값을 바꿔보세요.</p>
        <div className="cta-row reveal">
          <a className="_button fill-white pill" style={{padding: '16px 30px'} as React.CSSProperties} href="/auth" data-roll>Get Started</a>
          <a className="_button ghost-white" style={{padding: '16px 30px'} as React.CSSProperties} href="/lecture/w10" data-roll>View sample</a>
        </div>
      
        <div className="foot-links">
          <div className="fl-group">
            <div className="hd">PRODUCT</div>
            <a href="/library">Library</a>
            <a href="/lecture/w10">Workspace</a>
            <a href="#walkthrough">How it works</a>
            <a href="#calc">Pricing</a>
          </div>
          <div className="fl-group">
            <div className="hd">FEATURES</div>
            <a href="#hero">Slides</a>
            <a href="#hero">Audio recordings</a>
            <a href="#hero">Images</a>
            <a href="#calc">Calculator</a>
          </div>
          <div className="fl-group">
            <div className="hd">COMPANY</div>
            <a href="mailto:focustationcapstone@gmail.com">Team contact</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      
        <div className="certs">
          <span className="cert">STT</span><span className="cert">OCR</span><span className="cert">DTW 정렬</span><span className="cert">RAG Q&A</span><span className="cert">EXIF 자동 배치</span>
        </div>
      
        <div className="giant-lectra">Lectra</div>
      
        <div className="foot-base">
          <span>© 2026 Lectra — 소프트웨어공학 캡스톤 MVP</span>
          <div className="socials">
            <a className="_circle-button" href="#" title="GitHub">◈</a>
            <a className="_circle-button" href="#" title="Instagram">◎</a>
            <a className="_circle-button" href="mailto:focustationcapstone@gmail.com" title="Mail">✉</a>
          </div>
        </div>
      </section>
      
      </main>
      
    </div>
  );
}
