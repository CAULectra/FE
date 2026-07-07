/* ================================================================
   LandingPage — React landing page
   인터랙션은 useLandingEffects, 히어로 3D는 Hero3D,
   §2 카드 섹션은 ScrollStack(3장) + 마지막 카드에서 크림 전환.
   ================================================================ */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero3D from "./Hero3D";
import ScrollStack, { ScrollStackItem } from "./ScrollStack";
import TextType from "./TextType";
import LiveDemo from "./LiveDemo";
import { useLandingEffects } from "./useLandingEffects";
import "./landing.css";

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useLandingEffects(rootRef);

  /* §2.5 데모 모드: 기본 autoplay(자동재생). ?demo=scrub 로 스크럽(A) 버전 비교 */
  const demoMode: "scrub" | "autoplay" =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "scrub"
      ? "scrub"
      : "autoplay";

  /* 태그라인 등장 시점(히어로 스크롤 중반)에 TextType 타이핑 시작.
     sticky 히어로 안이라 startOnVisible은 로드 즉시 발동 → 스크롤 진행도로 게이팅. */
  const [copyOn, setCopyOn] = useState(false);
  useEffect(() => {
    let fired = false;
    const st = ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (!fired && self.progress >= 0.86) {
          fired = true;
          setCopyOn(true);
        }
      },
    });
    return () => st.kill();
  }, []);

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
            <p className="tagline-copy">
              {copyOn && (
                <TextType
                  as="span"
                  text="모든 자료를 한 화면에, 간편하게 완성하는 나만의 강의노트"
                  typingSpeed={55}
                  loop={false}
                  showCursor
                  cursorCharacter="|"
                />
              )}
            </p>
          </div>
          <button className="scroll-ind" id="scroll-ind"><i>↓</i> Scroll</button>
          {/* 히어로 끝을 walkthrough 다크(#120F17)로 페이드 → 두 섹션 자연 연결 */}
          <div className="hero-outro" aria-hidden="true"></div>
        </div>
      </section>
      
      {/* breathing room: 히어로와 워크스루 사이 여백 (히어로와 같은 다크 톤 #120F17) */}
      <div className="bridge" aria-hidden="true"></div>

      {/* ================= §2 CARDS (워크스루 대체) — 스크롤하며 쌓이는 3장 ================= */}
      <section className="cards-section" id="walkthrough">
        <ScrollStack
          className="cards-stack"
          itemDistance={92}
          itemScale={0.04}
          itemStackDistance={22}
          stackPosition="14%"
          baseScale={0.9}
          useWindowScroll
        >
          <ScrollStackItem itemClassName="workflow-card workflow-card-light">
            <div className="workflow-card-copy">
              <span className="workflow-index">01</span>
              <h3>Upload every source at once.</h3>
              <p>Drop the slide deck, lecture recording, and board photos into one lecture folder. Lectra keeps the raw material grouped before any AI pass begins.</p>
            </div>
            <div className="workflow-visual upload-visual" aria-hidden="true">
              <div className="upload-ring"><span>Ready</span></div>
              <div className="upload-file file-slide"><b>slides.pdf</b><small>42 pages</small></div>
              <div className="upload-file file-audio"><b>recording.m4a</b><small>61:30</small></div>
              <div className="upload-file file-photo"><b>board-photos</b><small>8 images</small></div>
            </div>
          </ScrollStackItem>

          <ScrollStackItem itemClassName="workflow-card workflow-card-dark">
            <div className="workflow-card-copy">
              <span className="workflow-index">02</span>
              <h3>Align the lecture timeline.</h3>
              <p>Speech, slide text, and photo timestamps are mapped to the same clock, so every sentence knows where it belongs.</p>
            </div>
            <div className="workflow-visual align-visual" aria-hidden="true">
              <div className="align-wave">
                {Array.from({ length: 20 }).map((_, i) => (
                  <i key={i} style={{ "--h": `${28 + ((i * 17) % 62)}%` } as React.CSSProperties} />
                ))}
              </div>
              <div className="align-track">
                <span>00:00</span><i></i><span>23:14</span><i></i><span>61:30</span>
              </div>
              <div className="align-script">
                <p><b>S12</b> the median key moves up</p>
                <p><b>S13</b> child nodes stay balanced</p>
                <p><b>S14</b> search remains logarithmic</p>
              </div>
            </div>
          </ScrollStackItem>

          <ScrollStackItem itemClassName="workflow-card workflow-card-light">
            <div className="workflow-card-copy">
              <span className="workflow-index">03</span>
              <h3>Study from the finished workspace.</h3>
              <p>Review synced notes, jump through cited answers, and see which slides deserve the most attention before the exam.</p>
            </div>
            <div className="workflow-visual workspace-visual" aria-hidden="true">
              <div className="workspace-rail">
                <span></span><span className="active"></span><span></span><span></span>
              </div>
              <div className="workspace-note">
                <b>Week 11 &mdash; B-Trees</b>
                <i style={{ width: "92%" }}></i>
                <i style={{ width: "78%" }}></i>
                <i className="highlight" style={{ width: "64%" }}></i>
                <i style={{ width: "86%" }}></i>
              </div>
              <div className="workspace-answer">
                <span>Q&amp;A</span>
                <p>Balanced inserts keep the tree shallow.</p>
                <small>S12 &middot; 23:14</small>
              </div>
            </div>
          </ScrollStackItem>
        </ScrollStack>
      </section>

      {/* ================= §2.5 LIVE DEMO (Krepling식 가이드 데모) =================
          autoplay(자동 재생 루프, 기본) ↔ scrub(A, 스크롤로 목업이 열리며 화면 채움).
          비교: 기본 = autoplay, URL ?demo=scrub = scrub */}
      <LiveDemo mode={demoMode} />

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
