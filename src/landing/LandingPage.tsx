/* ================================================================
   LandingPage — React landing page
   인터랙션은 useLandingEffects, 히어로 3D는 Hero3D,
   워크스루 배경은 DotField가 담당.
   ================================================================ */
import React, { useRef } from "react";
import { useNavigate } from "react-router";
import DotField from "./DotField";
import FloatingLines from "./FloatingLines";
import Hero3D from "./Hero3D";
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
            </div>
          </div>
          <a className="dock-link" href="/library">Workspace ↗</a>
          <div className="dock-item">
            <button className="dock-link">Company <span className="chev">▼</span></button>
            <div className="dropup">
              <a href="mailto:focustationcapstone@gmail.com">Team contact</a>
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
          <div className="hero-bg bg-static"><div className="hb hb1"></div><div className="hb hb2"></div><div className="hb hb3"></div></div>
          <Hero3D />
        <div className="hero-dim" />
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
          {/* 히어로 끝을 walkthrough 다크(#120F17)로 페이드 → 두 섹션 자연 연결 */}
          <div className="hero-outro" aria-hidden="true"></div>
        </div>
      </section>
      
      {/* breathing room: 히어로와 워크스루 사이 여백 (히어로와 같은 다크 톤 #120F17) */}
      <div className="bridge" aria-hidden="true"></div>

      {/* ================= WALKTHROUGH (pinned) ================= */}
      <section className="walkthrough" id="walkthrough">
        <div className="wt-pin" id="wt-pin">
          <div className="wt-dots">
            <DotField
              dotRadius={1.5}
              dotSpacing={14}
              bulgeStrength={67}
              glowRadius={160}
              cursorRadius={300}
              bulgeOnly
              gradientFrom="#ffffff"
              gradientTo="#B497CF"
              glowColor="#120F17"
            />
            <FloatingLines
              enabledWaves={["top", "middle", "bottom"]}
              lineCount={[8, 8, 8]}
              lineDistance={[8, 8, 8]}
              bendRadius={10}
              bendStrength={-2}
              interactive
              parallax
              animationSpeed={1}
              linesGradient={["#ed9cf3", "#6f6f6f", "#6a6a6a"]}
            />
          </div>
          <div className="wt-heading">
            <div className="line" id="wt-line">
              <span>Drop in your slides.</span>
              <span>Add the recording.</span>
              <span>Photos? Auto-placed.</span>
              <span>We align every sentence.</span>
              <span>Your workspace is ready.</span>
            </div>
          </div>
      
          <div className="browser" id="wt-browser" data-step="0">
            <div className="chrome"><span className="dots"><i></i><i></i><i></i></span><span className="url" id="wt-url">lectra.app/lecture/new</span><span style={{width: '45px'} as React.CSSProperties}></span></div>
            <div className="app board" id="wt-board">
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
              <div className="board-main">
                <div className="board-toolbar">
                  <div className="bt-title"><span className="bt-dot"></span>Week 11 — Hashing</div>
                  <div className="bt-status"><span className="s-run">Processing…</span><span className="s-done">Ready <b>✓</b></span></div>
                  <div className="bt-tags"><span>61:30</span><span>S1–S18</span><span>RAG</span></div>
                </div>
                <div className="board-stage">
                <div className="board-grid">
                  {/* 01 Slides */}
                  <div className="tile" data-tile="0">
                    <div className="tile-h"><span className="tdot c-cobalt"></span>Slides<b className="tick">✓</b></div>
                    <div className="tile-b">
                      <div className="sl-thumb">
                        <div className="sl-t">S12 — B-Tree insertion</div>
                        <div className="tln" style={{width: '82%'} as React.CSSProperties}></div>
                        <div className="tln" style={{width: '64%'} as React.CSSProperties}></div>
                        <div className="sl-frm">gˢ = yᶜ·β → O(log n)</div>
                      </div>
                      <div className="sl-pages"><i></i><i className="cur"></i><i></i><i></i></div>
                    </div>
                  </div>
                  {/* 02 Audio */}
                  <div className="tile" data-tile="1">
                    <div className="tile-h"><span className="tdot c-coral"></span>Audio<b className="tick">✓</b></div>
                    <div className="tile-b">
                      <div className="wave sm"><i style={{'--h': '60%'} as React.CSSProperties}></i><i style={{'--h': '85%'} as React.CSSProperties}></i><i style={{'--h': '45%'} as React.CSSProperties}></i><i style={{'--h': '95%'} as React.CSSProperties}></i><i style={{'--h': '55%'} as React.CSSProperties}></i><i style={{'--h': '75%'} as React.CSSProperties}></i><i style={{'--h': '40%'} as React.CSSProperties}></i><i style={{'--h': '90%'} as React.CSSProperties}></i><i style={{'--h': '65%'} as React.CSSProperties}></i><i style={{'--h': '80%'} as React.CSSProperties}></i></div>
                      <div className="cap-line"><span className="ts-chip">23:14</span>the median key moves <em>up</em></div>
                    </div>
                  </div>
                  {/* 03 Photos */}
                  <div className="tile" data-tile="2">
                    <div className="tile-h"><span className="tdot c-amber"></span>Photos<b className="tick">✓</b></div>
                    <div className="tile-b">
                      <div className="photo-grid sm">
                        <div className="photo-cell">📷<span className="stamp">23:40</span></div>
                        <div className="photo-cell">📷<span className="stamp">36:50</span></div>
                        <div className="photo-cell">📷<span className="stamp">48:12</span></div>
                        <div className="photo-cell add">＋</div>
                      </div>
                    </div>
                  </div>
                  {/* 04 Align */}
                  <div className="tile" data-tile="3">
                    <div className="tile-h"><span className="tdot c-terra"></span>Align<b className="tick">✓</b></div>
                    <div className="tile-b">
                      <div className="pipe-row done"><span className="n">✓</span>Speech-to-text<span className="pct">done</span></div>
                      <div className="pipe-row done"><span className="n">✓</span>Slide text<span className="pct">done</span></div>
                      <div className="pipe-row cur"><span className="n">4</span>Align script<span className="pct">100%</span></div>
                      <div className="wt-prog"><i></i></div>
                    </div>
                  </div>
                </div>{/* /board-grid */}
                <div className="board-workspace">
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
                      <div className="ms-bub q">Why split at the median?</div>
                      <div className="ms-bub a">Both nodes stay half-full, so inserts stay balanced.<br /><span className="cite">S12 · 23:14</span></div>
                    </div>
                  </div>
                </div>
                </div>{/* /board-stage */}
                <div className="board-tl">
                  <span className="play">▶</span>
                  <span className="tlt">23:14 / 61:30</span>
                  <span className="segs"><i className="done"></i><i className="done"></i><i className="done"></i><i className="cur"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
                </div>
              </div>{/* /board-main */}
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
          {/* 여백→walkthrough 연결: #120F17 커버가 걷히며 콘텐츠 fade-in */}
          <div className="wt-intro" aria-hidden="true"></div>
        </div>
      </section>
      
      {/* ================= WORKSPACE OVERVIEW ================= */}
      <section className="overview" id="overview">
        <div className="wrap overview-layout">
          <div className="overview-main">
            <div className="overview-copy reveal">
              <span className="_tag" style={{color: 'var(--orange)'} as React.CSSProperties}><span className="outline"></span>Workspace</span>
              <h2 className="t5" style={{marginTop: '16px'} as React.CSSProperties}>Lectra Workspace:<br />your go-to for every exam.</h2>
            </div>
            <div className="ov-check reveal">
              <h3 className="t5">Karaoke highlight? Sure.<br />Cited answers? Check.<br />Heatmaps? Also check.</h3>
              <p>현재 문장 자동 하이라이트, 원문 인용 칩이 달린 Q&A, 교수님이 오래 머문 슬라이드를 보여주는 체류시간 히트맵까지 — 정렬 하나로 전부 따라옵니다.</p>
              <a className="link-orange roll-host" href="/lecture/w10" data-roll>Learn more →</a>
            </div>
          </div>

          <aside className="overview-testimonials" aria-label="Student testimonials">
            <div className="quotes-label">Students say</div>
            <article className="quote-card">
              <p>"시험 전날 3배속으로 다시 듣던 걸 그만뒀어요. 교수님이 오래 머문 슬라이드만 골라 보니까 복습이 22분에 끝나요."</p>
              <div className="who"><span className="avatar" style={{background: 'var(--mint)'} as React.CSSProperties}>JH</span><span>지현<small>컴퓨터공학 3학년</small></span></div>
            </article>
            <article className="quote-card">
              <p>"필기 사진이 촬영 시각으로 노트에 자동 배치되는 게 진짜 편해요. 판서 놓친 날에도 친구 사진만 받으면 끝."</p>
              <div className="who"><span className="avatar" style={{background: 'var(--citrus)'} as React.CSSProperties}>MJ</span><span>민준<small>전자공학 2학년</small></span></div>
            </article>
            <article className="quote-card">
              <p>"Q&A 답변에 인용 칩이 붙어서 원문을 바로 확인할 수 있어요. 챗봇 환각 때문에 불안했던 게 사라졌어요."</p>
              <div className="who"><span className="avatar" style={{background: '#ffd9d0'} as React.CSSProperties}>SY</span><span>서연<small>수학과 4학년</small></span></div>
            </article>
          </aside>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="landing-footer" id="footer">
        <div className="foot-links">
          <div className="fl-group">
            <div className="hd">PRODUCT</div>
            <a href="/library">Library</a>
            <a href="/lecture/w10">Workspace</a>
            <a href="#walkthrough">How it works</a>
          </div>
          <div className="fl-group">
            <div className="hd">FEATURES</div>
            <a href="#hero">Slides</a>
            <a href="#hero">Audio recordings</a>
            <a href="#hero">Images</a>
          </div>
          <div className="fl-group">
            <div className="hd">COMPANY</div>
            <a href="mailto:focustationcapstone@gmail.com">Team contact</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
        <div className="giant-lectra">Lectra</div>
      </footer>
      
      </main>
      
    </div>
  );
}
