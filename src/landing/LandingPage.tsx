/* ================================================================
   LandingPage — React landing page
   인터랙션은 useLandingEffects, 히어로 3D는 Hero3D,
   §2 카드 섹션은 ScrollStack(3장) + 마지막 카드에서 크림 전환.
   ================================================================ */
import React, { useRef } from "react";
import { useNavigate } from "react-router";
import Hero3D from "./Hero3D";
import ScrollStack, { ScrollStackItem } from "./ScrollStack";
import LiveDemo from "./LiveDemo";
import UploadSources from "./UploadSources";
import AlignMap from "./AlignMap";
import QuoteLoop from "./QuoteLoop";
import TextType from "./TextType";
import { useLandingEffects } from "./useLandingEffects";
import { useIsMobile } from "./useIsMobile";
import MobileLanding from "./MobileLanding";
import "./landing.css";

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  /* 모바일에선 무거운 3D·스크롤 인터랙션을 mount조차 하지 않아 렉을 없앤다 */
  useLandingEffects(rootRef, !isMobile);

  if (isMobile) return <MobileLanding />;

  /* §2.5 데모 모드: 기본 autoplay(자동재생). ?demo=scrub 로 스크럽(A) 버전 비교 */
  const demoMode: "scrub" | "autoplay" =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "scrub"
      ? "scrub"
      : "autoplay";

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
              <a className="nav-cta" href="/library">시작하기</a>
            </div>
          </div>
          <div className="stage">
            <h1 className="hero-title t-display" id="hero-title">Lectra</h1>
            {/* 히어로 카피 2줄째 — 대형 Lectra 바로 아래 */}
            <p className="hero-sub">All your materials,<br />in one clear workspace.</p>
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
            <p className="tagline-copy">모든 자료를 한 화면에,<br />간편하게 완성하는 나만의 강의노트</p>
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
              <h3>Upload once.</h3>
              <p>슬라이드, 녹음, 판서 사진을 따로 관리할 필요 없이 <span className="brand">Lectra</span>가 한 강의 워크스페이스로 모아 정리합니다. 흩어진 자료를 다시 찾는 대신, 생성된 노트를 바로 열어보세요.</p>
            </div>
            {/* 아이콘 리플 카드 패턴: 아이콘 3개 + 클릭 리플 */}
            <div className="workflow-visual upload-visual">
              <UploadSources />
            </div>
          </ScrollStackItem>

          <ScrollStackItem itemClassName="workflow-card workflow-card-dark">
            <div className="workflow-card-copy">
              <span className="workflow-index">02</span>
              <h3>Stay in sync.</h3>
              <p>녹음 속 설명과 슬라이드, 사진을 따로 맞춰볼 필요 없이, <span className="brand">Lectra</span>가 강의 흐름에 맞춰 모든 자료를 연결합니다.</p>
            </div>
            {/* 파형 세그먼트가 아래 슬라이드로 매핑되는 애니메이션 (AlignMap.tsx) */}
            <div className="workflow-visual align-visual" aria-hidden="true">
              <AlignMap />
            </div>
          </ScrollStackItem>

          <ScrollStackItem itemClassName="workflow-card workflow-card-light">
            <div className="workflow-card-copy">
              <span className="workflow-index">03</span>
              <h3>Study faster.</h3>
              <p>자료를 다시 열어보고 처음부터 정리하는 대신, 완성된 워크스페이스에서 공부를 시작하세요. 슬라이드별 요약과 핵심 개념, 자료 기반 Q&amp;A를 활용한 나만의 노트를 제공합니다.</p>
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

      {/* ================= §2.5 LIVE DEMO (가이드 데모) =================
          autoplay(자동 재생 루프, 기본) ↔ scrub(A, 스크롤로 목업이 열리며 화면 채움).
          비교: 기본 = autoplay, URL ?demo=scrub = scrub */}
      <LiveDemo mode={demoMode} />

      {/* ================= WORKSPACE OVERVIEW ================= */}
      <section className="overview" id="overview">
        <div className="wrap overview-layout">
          <div className="overview-main">
            <div className="overview-copy reveal">
              <span className="_tag" style={{color: 'var(--orange)'} as React.CSSProperties}><span className="outline"></span>Workspace</span>
              <h2 className="t5" style={{marginTop: '16px'} as React.CSSProperties}><span className="ov-lead">자료 찾기는 그만,</span><span className="brand">Lectra</span>에서 시작하세요.</h2>
            </div>
            <div className="ov-check reveal">
              <p>슬라이드, 녹음, 판서 사진을 올리면 강의 흐름에 맞춰 하나의 워크스페이스로 정리됩니다. 다시 듣고 싶은 설명은 바로 찾아가고, 중요한 내용은 요약과 Q&amp;A로 먼저 확인하세요. 시험 전 복습이 더 빠르고 가벼워집니다.</p>
              <a className="link-orange roll-host" href="/lecture/w10" data-roll>Learn more →</a>
            </div>
          </div>

        </div>

        {/* 후기 가로 2줄 풀폭 밴드 — 양옆 페이드아웃 (QuoteLoop.tsx) */}
        <QuoteLoop />
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="landing-footer" id="footer">
        {/* 대형 워드마크 — TextType 무한 타이핑 루프 (type → pause → delete → repeat) */}
        <div className="giant-lectra">
          <TextType
            as="span"
            text={["Lectra"]}
            typingSpeed={150}
            pauseDuration={1800}
            deletingSpeed={90}
            loop
            showCursor
            cursorCharacter="_"
            startOnVisible
          />
        </div>
        <div className="foot-contact">
          <a href="mailto:lectranote@gmail.com">contact lectranote@gmail.com</a>
        </div>
      </footer>
      
      </main>
      
    </div>
  );
}
