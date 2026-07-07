# 랜딩 페이지 이름표 (Landing Map)

> 김민지 ↔ Claude 공용 명칭. 피드백 줄 때 이 이름(또는 §번호)으로 부르면 정확히 통합니다.
> 기준 코드: `src/landing/LandingPage.tsx` (baseline `c407e33`). 배경/인터랙션은 `Hero3D.tsx`, `DotField.tsx`, `FloatingLines.tsx`, `useLandingEffects.ts`, `landing.css`.

## 스크롤 순서 한눈에
```
[독/서포트 (항상 떠있음)]
 └ §0

▼ 스크롤
§1 히어로 (Spline)  ──▶  §1.4 태그라인 (Slides/Audio/Images)
§2 카드 3장 (Upload→Align→Study, 마지막 카드에서 배경 크림 전환)
§2.5 라이브 데모 (Krepling식: 큰 문구 + 앱 목업 위 커서 자동 시연)
§3 오버뷰 (붉은 그라데이션 + 후기)
§4 푸터 (대형 Lectra)
```

---

## §0 전역 (Global)
| 이름 | 코드 | 설명 |
|---|---|---|
| **랜딩 루트** | `.landing-root` | 페이지 최상위 래퍼 |
| **독 (하단 네비)** | `.dock` `#dock` | 하단 중앙 오렌지 알약 네비 (Product·Workspace·Company 드롭업) |
| **서포트 필** | `.support-pill` | 우하단 `💬 Support` |

## §1 히어로 (HERO) — `.hero` `#hero`  *(240vh, 스크롤 핀)*
| 이름 | 코드 | 설명 |
|---|---|---|
| §1.1 **히어로 배경** | `.hero-bg`(+블롭 `.hb`), `Hero3D`(`#discs`) | Spline 3D 원판 + 그라데이션 폴백 + `.hero-dim`/`.hero-vignette`/`.hero-grain` |
| §1.2 **상단바** | `.top-nav` | 로고 `Lectra`, 언어(KO), `Log in`, `Sign up` |
| §1.3 **히어로 타이틀** | `.stage` → `.hero-title` | "One app for every lecture" + `.hero-aside`(부제 + `.app-badges` Web App/App Store) |
| §1.4 **태그라인** | `.taglines` `#taglines` | 스크롤하며 하나씩 등장하는 3개: **Slides**(`.tl-slides`) · **Audio recordings**(`.tl-audio`) · **Images**(`.tl-images`) |
| §1.4b **태그라인 카피** | `.tagline-copy` | 태그라인 아래 큰 **정적** 문구 "모든 자료를 한 화면에, 간편하게 완성하는 나만의 강의노트" (타이핑 애니메이션 없음 — 애니메이션은 위 태그라인에만) |
| §1.5 **스크롤 인디케이터** | `.scroll-ind` | 좌하단 "↓ Scroll" |
| §1.6 **히어로 아웃로** | `.hero-outro` | 검정(#120F17) 오버레이. heroTl 아님 — **카드 섹션 진입 시**(`start:"top bottom"→end:"top 58%"`) 페이드인해 태그라인을 덮어 fade-out + Spline→다크 seam 연결 |
| (브릿지) | `.bridge` | 히어로↔워크스루 사이 다크 여백 |

## §2 카드 섹션 (CARDS) — `.cards-section` `#walkthrough`  *(스크롤하며 쌓이는 3장 + 크림 전환)*
> 배경은 다크(#120F17)로 시작 → **마지막(③) 카드 스크롤에 맞춰 크림(#f6f1eb)으로 스크럽 전환** (`useLandingEffects`).
> 카드는 `ScrollStack`(sticky) 컴포넌트로 쌓임.

| 이름 | 코드 | 설명 |
|---|---|---|
| §2.0 **카드 스택** | `.cards-stack` (`ScrollStack`) | 3장을 sticky로 쌓는 래퍼 |
| §2.1 **① Upload 카드** | `.workflow-card.workflow-card-light` (01) | 흰색. "Upload every source" + 업로드 링 + 파일칩(slides.pdf·recording.m4a·board-photos) |
| §2.2 **② Align 카드** | `.workflow-card.workflow-card-dark` (02) | 검정. "Align the lecture timeline" + 파형 + 타임라인 + 정렬 스크립트 |
| §2.3 **③ Study 카드** | `.workflow-card.workflow-card-light` (03) | 흰색. "Study from the finished workspace" + 슬라이드 레일 + 노트 + Q&A. **이 카드에서 배경 크림 전환** |
| (카드 내부) | `.workflow-card-copy`(좌측 카피) / `.workflow-visual`(우측 목업) | 각 카드 = 카피 + 비주얼 2열 |

## §2.5 라이브 데모 (LIVE DEMO) — `.demo-section` `#demo`  *(Krepling식, 밝은 캔버스·오렌지 액센트)*
> `LiveDemo.tsx`. 두 모드(`mode` prop):
> - **autoplay** (기본): 화면 안에 들어오면 스스로 **자동 재생 루프**(헤드라인 위·목업 아래 블록, 목업 고정 크기, 탭은 스테이지 내부). 커서가 스스로 이동·클릭하며 upload→align→study→Q&A 시연.
> - **scrub** (A/보존): 섹션 340vh **핀 고정** → 스크롤하면 크림 위 헤드라인만 있다가 목업이 페이드+확대(→1.16, 좌측 이동해 우측 탭 거터 확보)로 **열리며 화면을 채움**. 커서·단계·클릭이 스크롤 진행도에 **스크럽 동기화**.
> `LandingPage`가 렌더(기본 autoplay). URL `?demo=scrub`로 스크럽(A) 버전 비교. reduced-motion이면 정적(Study).

| 이름 | 코드 | 설명 |
|---|---|---|
| §2.5a **큰 문구** | `.demo-lead` (`.demo-headline` + `.accent`) | "Four sources in. **One exam-ready note out.**"(오렌지 강조) + eyebrow + 한글 서브 |
| §2.5b **데모 스테이지** | `.demo-stage` (`.demo-gradient`) | 소프트 파스텔 그라데이션 라운드 패널 |
| §2.5c **앱 목업** | `.demo-app[data-step]` | 3단계 크로스페이드: `.da-upload`(0) / `.da-align`(1) / `.da-study`(2) |
| §2.5d **커서** | `.demo-cursor` (SVG) | 검은 화살표. scrub=스크롤 웨이포인트, autoplay=GSAP 타임라인. `.click` 피드백. 핀 자식이라 확대 영향 X |
| §2.5e **단계 탭** | `.demo-tabs` (`.demo-tab`) | 우측 Upload/Align/Study, 단계 동기화(`.active`). scrub=핀 고정(뷰포트 우측 거터), autoplay=스테이지 내부 |

## §3 오버뷰 (OVERVIEW) — `.overview` `#overview`  *(붉은 그라데이션)*
| 이름 | 코드 | 설명 |
|---|---|---|
| §3.1 **오버뷰 카피** | `.overview-copy` + `.ov-check` | Workspace 태그 + 헤딩, "Karaoke/Cited/Heatmaps" + 설명 + `Learn more →` |
| §3.2 **후기 카드** | `.overview-testimonials` → `.quote-card` ×3 | "Students say" (지현·민준·서연) |

## §4 푸터 (FOOTER) — `.landing-footer` `#footer`
| 이름 | 코드 | 설명 |
|---|---|---|
| §4.1 **푸터 링크** | `.foot-links` | 3열: PRODUCT · FEATURES · COMPANY |
| §4.2 **대형 워드마크** | `.giant-lectra` | 초대형 "Lectra" |

---

## 파일 역할
| 파일 | 담당 |
|---|---|
| `LandingPage.tsx` | 전체 마크업 (위 구조) |
| `landing.css` | 모든 스타일 (`.landing-root` 스코프) |
| `useLandingEffects.ts` | GSAP+Lenis 인터랙션 (타이틀 인트로, 태그라인 등장, 워크스루 핀 5단계) |
| `Hero3D.tsx` | §1.1 Spline 3D iframe (오버스캔·해상도·화면밖 정지) |
| `ScrollStack.tsx` | §2 sticky 카드 스택 컴포넌트 |
| `LiveDemo.tsx` | §2.5 Krepling식 커서 자동 시연 데모 |
| `DotField.tsx` / `FloatingLines.tsx` | (현재 랜딩 미사용 — 이전 워크스루 배경. orphan) |
