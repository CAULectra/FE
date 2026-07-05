/* ================================================================
   Lectra v2 — 목 데이터 (과목 3개, 전부 실제 첨부 강의자료 기반)
   - 정보보호이론: 06. Zero-Knowledge Proofs (16p)
   - 알고리즘:     05. 백트래킹 (38p)
   - 컴퓨터네트워크: Ch5. Network Layer — Control Plane (52p)
   페이지 렌더: public/slides/{zk,bt,cn}/p{n}.png
   주의: script.t 는 반드시 해당 slide 의 [startSec, endSec) 안에 있어야
   동기화(시간→슬라이드 매핑)가 성립한다.
   ================================================================ */
import type { Folder, Lecture, Slide, StudyData } from "./types";
import { BT_TITLES, CN_TITLES } from "./slides.gen";

export const SEED_FOLDERS: Folder[] = [
  { id: "is", name: "정보보호이론" },
  { id: "al", name: "알고리즘" },
  { id: "cn", name: "컴퓨터네트워크" },
];

export const SEED_LECTURES: Lecture[] = [
  /* 정보보호이론 */
  { id: "w10",  title: "06. Zero-Knowledge Proofs", folderId: "is", uploadedAt: "2026-07-04", updatedLabel: "Jul 4",  status: "ready", progress: 100, stepIndex: 5, slideCount: 16, audioSec: 3690, photoCount: 2, hasAudio: true },
  { id: "is05", title: "05. Digital Signature",     folderId: "is", uploadedAt: "2026-06-27", updatedLabel: "Jun 27", status: "ready", progress: 100, stepIndex: 5, slideCount: 21, audioSec: 4230, photoCount: 1, hasAudio: true },
  { id: "is07", title: "07. Commitment Schemes",    folderId: "is", uploadedAt: "2026-07-05", updatedLabel: "Jul 5",  status: "processing", progress: 45, stepIndex: 1, etaMin: 6, slideCount: 18, audioSec: 3480, photoCount: 0, hasAudio: true },
  /* 알고리즘 */
  { id: "bt05", title: "05. 백트래킹",               folderId: "al", uploadedAt: "2026-07-02", updatedLabel: "Jul 2",  status: "ready", progress: 100, stepIndex: 5, slideCount: 38, audioSec: 2850, photoCount: 1, hasAudio: true },
  { id: "bt04", title: "04. 분할 정복",              folderId: "al", uploadedAt: "2026-06-25", updatedLabel: "Jun 25", status: "ready", progress: 100, stepIndex: 5, slideCount: 34, audioSec: 3120, photoCount: 0, hasAudio: true },
  { id: "bt06", title: "06. 동적 계획법",            folderId: "al", uploadedAt: "2026-07-05", updatedLabel: "Jul 5",  status: "queued", progress: 0, stepIndex: 0, queueOrder: 1, slideCount: 41, audioSec: 3300, photoCount: 0, hasAudio: true },
  /* 컴퓨터네트워크 */
  { id: "cn05", title: "Ch5. Network Layer — Control Plane", folderId: "cn", uploadedAt: "2026-07-03", updatedLabel: "Jul 3", status: "ready", progress: 100, stepIndex: 5, slideCount: 52, audioSec: 3480, photoCount: 1, hasAudio: true },
  { id: "cn04", title: "Ch4. Network Layer — Data Plane",    folderId: "cn", uploadedAt: "2026-06-26", updatedLabel: "Jun 26", status: "failed", progress: 52, stepIndex: 2, failedStep: 2, errorCode: "PDF_PARSE_ERROR", slideCount: 48, audioSec: 3900, photoCount: 0, hasAudio: true },
  { id: "cnref",title: "Socket Programming 참고자료",         folderId: "cn", uploadedAt: "2026-06-20", updatedLabel: "Jun 20", status: "ready", progress: 100, stepIndex: 5, slideCount: 52, audioSec: 0, photoCount: 0, hasAudio: false },
];

/** 페이지 제목 배열 → 균등 분할 타임라인 슬라이드 */
const mkSlides = (titles: string[], key: string, duration: number): Slide[] => {
  const seg = duration / titles.length;
  return titles.map((title, i) => ({
    n: i + 1,
    title,
    startSec: Math.round(i * seg),
    endSec: Math.round((i + 1) * seg),
    img: `/slides/${key}/p${i + 1}.png`,
  }));
};

/* ================= 정보보호이론 — 06. Zero-Knowledge Proofs ================= */

const zkS = (n: number, title: string, startSec: number, endSec: number) =>
  ({ n, title, startSec, endSec, img: `/slides/zk/p${n}.png` });

export const STUDY_ZK: StudyData = {
  lectureId: "w10",
  courseName: "정보보호이론",
  defaultSlide: 9,
  durationSec: 3690, // 61:30
  slides: [
    zkS(1,  "06. Zero-Knowledge Proofs", 0, 150),
    zkS(2,  "Proof Systems", 150, 390),
    zkS(3,  "Interactive Proof Systems in Cryptography", 390, 630),
    zkS(4,  "Σ-Protocol for Relation R", 630, 900),
    zkS(5,  "Zero-Knowledge Proofs", 900, 1080),
    zkS(6,  "Toy Example: Alibaba's Cave", 1080, 1230),
    zkS(7,  "Another Reference for Understanding ZK", 1230, 1320),
    zkS(8,  "Toy Example: Where is Wally?", 1320, 1380),
    zkS(9,  "Schnorr's Protocol for Proving Knowledge of DL", 1380, 1560),
    zkS(10, "Schnorr's Protocol (Cont.)", 1560, 1800),
    zkS(11, "Making a Σ-Protocol Non-Interactive", 1800, 2040),
    zkS(12, "Non-Interactive Version of Schnorr's Protocol", 2040, 2280),
    zkS(13, "Signature from a Non-Interactive ZK Protocol", 2280, 2520),
    zkS(14, "Schnorr Signature", 2520, 2880),
    zkS(15, "Schnorr Signature (Cont.)", 2880, 3240),
    zkS(16, "References", 3240, 3690),
  ],
  script: [
    { id: "sc1", slide: 9,  t: 1382, text: "Schnorr's protocol proves knowledge of the discrete log x for a public value y equals g to the x." },
    { id: "sc2", slide: 9,  t: 1394, text: "The prover first picks a random alpha and commits to beta, g to the alpha mod p." },
    { id: "sc3", slide: 9,  t: 1406, text: "The verifier replies with a random challenge c." },
    { id: "sc4", slide: 9,  t: 1430, text: "The response s equals x times c plus alpha — and that's all the prover reveals." },
    { id: "sc5", slide: 10, t: 1570, text: "Verification checks g to the s equals y to the c times beta. Completeness follows directly." },
    { id: "sc6", slide: 10, t: 1650, text: "If a prover answers two different challenges for the same beta, we can extract the witness x." },
    { id: "sc7", slide: 11, t: 1810, text: "The Fiat-Shamir heuristic replaces the verifier's challenge with a hash of the announcement." },
    { id: "sc8", slide: 13, t: 2300, text: "Binding the message into that hash gives us a signature scheme — this is the key idea." },
    { id: "sc9", slide: 14, t: 2530, text: "That is exactly the Schnorr signature: c equals hash of M, beta, and y." },
  ],
  chapters: [
    {
      idx: 0, title: "Chapter 1", sub: "증명 시스템과 Σ-프로토콜", pages: "1~4페이지", slides: [1, 4],
      intro: "증명자(P)가 검증자(V)를 납득시키는 '증명 시스템'의 개념에서 출발해, 모든 영지식 증명의 뼈대가 되는 3-move 구조 Σ-프로토콜까지 정리합니다.",
      meta: "슬라이드 4장 · 녹음 12분 반영",
      summary: [
        "고전적 증명 = 필기시험: P가 다 써서 내면 V가 채점 (상호작용 없음)",
        "대화형 증명: P↔V가 메시지를 주고받으며 확률적으로 검증",
        "Σ-프로토콜 = announcement(a) → challenge(c) → response(r) 3-move 구조",
        "witness w: 관계 R = {(v, w)}에서 P만 아는 비밀 (예: v = SHA-256(w)의 w)",
      ],
      blocks: [
        { kind: "section", title: "증명 시스템 (Proof System)", body: "언어 L에 대해 P가 V를 납득시키는 논증. 고전적 증명은 P가 전부 써 내려가고 V가 검사할 뿐 상호작용이 없다. 그러나 '그래프 비동형 증명'처럼 고전적 방식으로는 증명이 어려운 실제 사례가 많아 대화형 증명이 필요해진다." },
        { kind: "table", headers: ["단계", "주체", "내용"], rows: [
          ["1. announcement a", "P → V", "커밋 성격의 첫 메시지 a = α(v, w, uP)"],
          ["2. challenge c", "V → P", "무작위 챌린지 c ←$ C"],
          ["3. response r", "P → V", "r = ρ(v, w, c, uP), V는 φ(v, a, c, r) 검사"],
        ] },
        { kind: "audio", slide: 4, t: 700, text: "\"Σ 모양처럼 세 번 오간다고 해서 Σ-프로토콜입니다 — 시험에 그림 그리라고 낼 거예요.\"" },
      ],
    },
    {
      idx: 1, title: "Chapter 2", sub: "영지식 증명의 세 가지 성질", pages: "5~8페이지", slides: [5, 8],
      intro: "영지식 증명이 만족해야 하는 세 성질(완전성·건전성·영지식성)을 정의하고, 알리바바 동굴과 월리를 찾아라 두 가지 직관적 예시로 이해합니다.",
      meta: "슬라이드 4장 · 판서 1장 · 녹음 8분 반영",
      summary: [
        "완전성(Completeness): 둘 다 정직하면 V는 항상 수락",
        "건전성(Soundness): 거짓 명제로는 (무시할 확률 제외) V를 속일 수 없음",
        "영지식성(Zero-Knowledgeness): V는 명제가 참이라는 사실 외에 아무것도 얻지 못함",
        "알리바바 동굴: 주문(비밀)을 모른 채 반복 성공할 확률은 2⁻ⁿ으로 소멸",
      ],
      blocks: [
        { kind: "section", title: "세 가지 성질", body: "완전성은 '되는 건 된다', 건전성은 '안 되는 건 안 된다', 영지식성은 '비밀은 한 비트도 새지 않는다'로 요약할 수 있다. 세 번째가 이 단원의 핵심 — 증명 과정을 통째로 시뮬레이션할 수 있으면 V가 얻은 정보가 없다는 뜻이다." },
        { kind: "handwriting", slide: 6, t: 1120, photoId: "zk_ph1", caption: "동굴 그림 판서 — A/B 갈래와 반복 확률" },
      ],
    },
    {
      idx: 2, title: "Chapter 3", sub: "Schnorr 프로토콜과 Fiat-Shamir 변환", pages: "9~12페이지", slides: [9, 12],
      intro: "이산로그 지식을 증명하는 Schnorr 프로토콜을 3-move로 구성하고, 해시로 챌린지를 대체하는 Fiat-Shamir 휴리스틱으로 비대화형(NIZK)으로 바꿉니다. 이 강의의 핵심 챕터입니다.",
      meta: "슬라이드 4장 · 판서 1장 · 녹음 18분 반영",
      summary: [
        "목표: y = gˣ가 공개일 때 x를 안다는 것을 x 노출 없이 증명",
        "P: α ←$ Zq, β = gᵅ 전송 → V: c ←$ Zq → P: s = xc + α",
        "검증: gˢ =? yᶜ·β (완전성은 지수 계산으로 즉시 성립)",
        "같은 β에 두 챌린지 응답이 나오면 x = (s−s′)/(c−c′) 추출 → 건전성",
        "Fiat-Shamir: c = H(β, y)로 대체 → 비대화형, 랜덤 오라클 모델에서 안전",
      ],
      blocks: [
        { kind: "code", filename: "schnorr_protocol", code: "P:  α ←$ Zq\n    β = g^α mod p          # announcement\nV:  c ←$ Zq                # challenge\nP:  s = x·c + α mod q      # response\nV:  g^s ≟ y^c · β          # verify" },
        { kind: "section", title: "건전성 스케치", body: "부정한 P가 같은 β로 두 유효 응답 (c, s), (c′, s′)를 만들면 g^(s−s′) = y^(c−c′)이므로 y = g^((s−s′)/(c−c′)). 즉 응답 두 개에서 witness x가 계산된다 — 지식 추출기(extractor)의 존재가 곧 건전성이다." },
        { kind: "handwriting", slide: 9, t: 1420, photoId: "zk_ph2", caption: "커밋 → 챌린지 → 응답 흐름 판서" },
        { kind: "audio", slide: 11, t: 1810, text: "\"검증자를 해시함수로 갈아끼우는 겁니다. 해시가 예측 불가능하니 챌린지 역할을 대신하죠.\"" },
      ],
    },
    {
      idx: 3, title: "Chapter 4", sub: "Schnorr 서명", pages: "13~16페이지", slides: [13, 16],
      intro: "비대화형 영지식 증명에 메시지 M을 묶으면 그대로 서명이 됩니다. Schnorr 서명의 키 생성·서명·검증 알고리즘을 정리합니다.",
      meta: "슬라이드 4장 · 녹음 14분 반영",
      summary: [
        "NIZK의 해시에 메시지를 포함: c = H(M, β, y) → 서명 (β 또는 c, s)",
        "KeyGen: 위수 q의 순환군 G, 생성원 g, 비밀 x, 공개키 y = gˣ",
        "Sign: α ←$ Z*q, β = gᵅ, c = H(M, β, y), s = α + xc",
        "Verify: β′ = gˢ·y⁻ᶜ 계산 후 c ≟ H(M, β′, y)",
      ],
      blocks: [
        { kind: "code", filename: "schnorr_signature", code: "KeyGen:  x ←$ Z*q,  y = g^x\n         pk = (p, q, g, y),  sk = x\nSign(M): α ←$ Z*q,  β = g^α\n         c = H(M, β, y)\n         s = α + x·c mod q   → σ = (c, s)\nVerify:  β' = g^s · y^(−c)\n         c ≟ H(M, β', y)" },
        { kind: "section", title: "왜 안전한가", body: "서명 위조는 곧 Schnorr 프로토콜의 건전성을 깨는 것과 같다. 랜덤 오라클 모델에서 이산로그 문제가 어려운 한 위조 불가능(EUF-CMA)하다. DSA·EdDSA 계열 서명의 원형이기도 하다." },
        { kind: "audio", slide: 14, t: 2530, text: "\"기말 단골: Sign과 Verify를 빈칸으로 내고 c = H(M, β, y) 채우게 합니다.\"" },
      ],
    },
  ],
  photos: [
    { id: "zk_ph1", slide: 6, t: 1120, label: "판서 — 알리바바 동굴 그림" },
    { id: "zk_ph2", slide: 9, t: 1420, label: "판서 — Schnorr 3-move 흐름" },
  ],
  overall: "이 강의는 증명 시스템 → Σ-프로토콜 → 영지식 증명(3성질) → Schnorr 프로토콜 → Fiat-Shamir 변환 → Schnorr 서명으로 이어지는 한 줄기 흐름입니다. 핵심은 \"대화형 증명의 챌린지를 해시로 대체하면 비대화형이 되고, 그 해시에 메시지를 넣으면 서명이 된다\"는 연결고리입니다.",
  chaptersEn: [
    { title: "Chapter 1 — Proof Systems & Σ-Protocol", summary: [
      "Classical proofs are like written exams — no interaction between P and V.",
      "Interactive proofs let P convince V through randomized message exchange.",
      "A Σ-protocol is the 3-move skeleton: announcement → challenge → response.",
    ] },
    { title: "Chapter 2 — Zero-Knowledge Proofs", summary: [
      "Completeness: an honest prover always convinces an honest verifier.",
      "Soundness: a false statement convinces V only with negligible probability.",
      "Zero-knowledgeness: V learns nothing beyond the truth of the statement.",
    ] },
    { title: "Chapter 3 — Schnorr's Protocol & Fiat-Shamir", summary: [
      "Goal: prove knowledge of x with y = gˣ public, without revealing x.",
      "Flow: β = gᵅ → random challenge c → response s = xc + α; verify gˢ = yᶜ·β.",
      "Fiat-Shamir replaces c with H(β, y), yielding a non-interactive proof.",
    ] },
    { title: "Chapter 4 — Schnorr Signature", summary: [
      "Binding the message M into the hash turns the NIZK into a signature.",
      "Sign: β = gᵅ, c = H(M, β, y), s = α + xc; verify by recomputing β′.",
      "Schnorr is the ancestor of DSA/EdDSA-style signatures.",
    ] },
  ],
  overallEn: "The lecture is one continuous thread: proof systems → Σ-protocols → the three properties of zero-knowledge → Schnorr's protocol → the Fiat-Shamir transform → Schnorr signatures.",
};

/* ================= 알고리즘 — 05. 백트래킹 (38p, 47:30) ================= */

export const STUDY_BT: StudyData = {
  lectureId: "bt05",
  courseName: "알고리즘",
  defaultSlide: 17,
  durationSec: 2850,
  slides: mkSlides(BT_TITLES, "bt", 2850),
  script: [
    { id: "bt1", slide: 8,  t: 540,  text: "즉 DP와는 다른 Smart Brute-Force예요. 중복 부분문제가 아니라 가지치기가 핵심입니다." },
    { id: "bt2", slide: 17, t: 1205, text: "N-Queens는 각 행에 퀸을 하나씩 놓으면서 상태 공간 트리를 내려갑니다." },
    { id: "bt3", slide: 18, t: 1290, text: "같은 열이거나 대각선이면 유망하지 않다고 보고 그 가지를 통째로 칩니다." },
    { id: "bt4", slide: 19, t: 1360, text: "promising이 거짓이면 그 아래 서브트리는 아예 방문하지 않아요." },
    { id: "bt5", slide: 28, t: 2030, text: "부분 집합의 합에서는 남은 원소를 다 더해도 목표에 못 미치면 바로 가지치기합니다." },
  ],
  chapters: [
    {
      idx: 0, title: "Chapter 1", sub: "백트래킹과 상태 공간 트리", pages: "1~11페이지", slides: [1, 11],
      intro: "모든 해 후보를 트리로 조직화한 '상태 공간 트리'를 DFS로 탐색하되, 유망하지 않은 노드의 서브트리를 통째로 잘라내는 백트래킹의 기본 틀을 세웁니다.",
      meta: "슬라이드 11장 · 녹음 14분 반영",
      summary: [
        "상태 공간 트리: 해 후보 전체를 루트→리프 경로로 조직화한 트리",
        "백트래킹 = DFS + 가지치기(pruning): 유망하지 않으면 되돌아감",
        "유망 함수 promising(v): v 아래에 해가 있을 '가능성'을 판정",
        "DP와 구분: DP는 중복 부분문제 재활용, 백트래킹은 Smart Brute-Force",
      ],
      blocks: [
        { kind: "section", title: "유망 함수의 건전성", body: "유망 함수는 '해가 없는데 있다'고 말해도 되지만(탐색만 늘어남), '해가 있는데 없다'고 말하면 안 된다(정답을 놓침). 즉 false-negative가 없어야 건전하다." },
        { kind: "code", filename: "backtrack_skeleton", code: "def backtrack(v):\n    if promising(v):\n        if v is a solution:\n            report(v)\n        else:\n            for child u of v:\n                backtrack(u)" },
        { kind: "audio", slide: 8, t: 540, text: "\"DP는 중복 부분문제, 백트래킹은 가지치기 — 이 구분 헷갈리면 시험에서 다 틀립니다.\"" },
      ],
    },
    {
      idx: 1, title: "Chapter 2", sub: "미로 문제와 N-Queens", pages: "12~21페이지", slides: [12, 21],
      intro: "막히면 갈림길로 되돌아가는 미로 탐색으로 직관을 잡고, 백트래킹의 대표 예제인 N-Queens에서 유망성 검사를 구체화합니다.",
      meta: "슬라이드 10장 · 판서 1장 · 녹음 12분 반영",
      summary: [
        "미로: 막다른 길 = 유망하지 않음 → 직전 갈림길로 백트랙",
        "N-Queens: 행마다 퀸 1개 배치, 열/대각선 충돌 검사",
        "대각선 충돌: |col(i) − col(k)| = i − k 이면 같은 대각선",
        "유망성 검사 덕분에 4-Queens 상태 공간 256개 중 극히 일부만 방문",
      ],
      blocks: [
        { kind: "code", filename: "nqueens_promising", code: "def promising(i, col):\n    for k in range(i):\n        if col[k] == col[i] or \\\n           abs(col[i] - col[k]) == i - k:\n            return False   # 같은 열 or 대각선\n    return True" },
        { kind: "handwriting", slide: 18, t: 1290, photoId: "bt_ph1", caption: "N-Queens 가지치기 트리 손그림" },
      ],
    },
    {
      idx: 2, title: "Chapter 3", sub: "그래프 색칠과 부분 집합의 합", pages: "22~32페이지", slides: [22, 32],
      intro: "m-색칠 문제와 부분 집합의 합 문제에 같은 틀을 적용합니다. 문제마다 달라지는 것은 오직 유망 함수뿐입니다.",
      meta: "슬라이드 11장 · 녹음 11분 반영",
      summary: [
        "그래프 m-색칠: 인접 정점과 색이 겹치면 유망하지 않음",
        "부분 집합의 합: weight(현재 합) + 남은 원소 합 < W → 가지치기",
        "weight + 다음 원소 > W 인 가지도 잘라냄 (정렬해두면 판정 쉬움)",
        "같은 backtrack 뼈대 + 문제별 promising만 교체",
      ],
      blocks: [
        { kind: "table", headers: ["문제", "유망하지 않음 조건"], rows: [
          ["그래프 m-색칠", "인접 정점이 이미 같은 색"],
          ["부분 집합의 합", "합 + 남은 전부 < W  또는  합 + 최솟값 > W"],
          ["N-Queens", "같은 열 또는 같은 대각선"],
        ] },
      ],
    },
    {
      idx: 3, title: "Chapter 4", sub: "0/1 배낭 문제와 정리", pages: "33~38페이지", slides: [33, 38],
      intro: "최적화 문제인 0/1 배낭에 백트래킹을 적용하면, '지금까지 최고 해보다 나아질 수 없는' 가지를 잘라내는 분기 한정(bound)의 아이디어로 이어집니다.",
      meta: "슬라이드 6장 · 녹음 9분 반영",
      summary: [
        "0/1 배낭: 넣는다/안 넣는다의 이진 상태 공간 트리",
        "bound: 남은 물건을 fractional로 채웠을 때의 상한 이익",
        "bound ≤ 현재 최고 이익 → 유망하지 않음 (분기 한정법의 씨앗)",
        "다음 강의(동적 계획법)와의 비교 포인트 정리",
      ],
      blocks: [
        { kind: "section", title: "분기 한정으로 가는 다리", body: "판정 문제(해 존재?)에서는 promising이 단순 충돌 검사지만, 최적화 문제에서는 '이 가지의 최선이 현재 최고 기록을 못 넘는가'가 기준이 된다. 이 상한(bound) 계산이 다음 단원 분기 한정법(Branch & Bound)의 핵심이 된다." },
      ],
    },
  ],
  photos: [
    { id: "bt_ph1", slide: 18, t: 1290, label: "판서 — N-Queens 가지치기 트리" },
  ],
  overall: "백트래킹은 상태 공간 트리를 DFS로 탐색하며 유망하지 않은 서브트리를 잘라내는 Smart Brute-Force입니다. 미로 → N-Queens → 그래프 색칠 → 부분 집합의 합 → 0/1 배낭 순서로, 뼈대는 고정한 채 유망 함수만 바꿔 끼우는 것이 이 강의의 한 줄 요약입니다.",
  chaptersEn: [
    { title: "Chapter 1 — Backtracking & State Space Tree", summary: [
      "Organize all candidate solutions as root-to-leaf paths of a state space tree.",
      "Backtracking = DFS + pruning: abandon nodes that are not promising.",
      "Unlike DP (overlapping subproblems), this is a smart brute-force.",
    ] },
    { title: "Chapter 2 — Maze & N-Queens", summary: [
      "A dead end in the maze means 'not promising' — backtrack to the last fork.",
      "N-Queens places one queen per row, checking column/diagonal conflicts.",
      "Same diagonal iff |col(i) − col(k)| = i − k.",
    ] },
    { title: "Chapter 3 — Graph Coloring & Subset Sum", summary: [
      "m-coloring: a node is not promising if an adjacent vertex shares its color.",
      "Subset sum: prune when current weight plus all remaining items is below W.",
      "Only the promising function changes; the skeleton stays identical.",
    ] },
    { title: "Chapter 4 — 0/1 Knapsack", summary: [
      "Binary state space tree: include or exclude each item.",
      "Prune when the fractional upper bound cannot beat the best profit so far.",
      "This bound idea leads directly to branch-and-bound.",
    ] },
  ],
  overallEn: "Backtracking explores the state space tree by DFS and prunes unpromising subtrees. From the maze to N-Queens, graph coloring, subset sum and 0/1 knapsack, the skeleton never changes — only the promising function does.",
};

/* ============ 컴퓨터네트워크 — Ch5. Control Plane (52p, 58:00) ============ */

export const STUDY_CN: StudyData = {
  lectureId: "cn05",
  courseName: "컴퓨터네트워크",
  defaultSlide: 13,
  durationSec: 3480,
  slides: mkSlides(CN_TITLES, "cn", 3480),
  script: [
    { id: "cn1", slide: 12, t: 745,  text: "Link-state routing floods the topology, so every router ends up with the full network map." },
    { id: "cn2", slide: 13, t: 810,  text: "Dijkstra grows the set N-prime by picking the minimum-cost node each iteration." },
    { id: "cn3", slide: 18, t: 1145, text: "Distance vector is fully distributed — each node only talks to its direct neighbors." },
    { id: "cn4", slide: 23, t: 1480, text: "Bad news travels slowly — that is the count-to-infinity problem." },
    { id: "cn5", slide: 36, t: 2360, text: "BGP advertises paths, not costs. Policy beats shortest path on the Internet." },
  ],
  chapters: [
    {
      idx: 0, title: "Chapter 1", sub: "네트워크 제어 평면 개요", pages: "1~6페이지", slides: [1, 6],
      intro: "포워딩 테이블을 '누가, 어떻게' 계산하는가의 문제. 라우터마다 계산하는 전통 방식과 논리적으로 중앙화된 SDN 방식을 대비합니다.",
      meta: "슬라이드 6장 · 녹음 7분 반영",
      summary: [
        "제어 평면 = 포워딩 테이블(전달 규칙)을 계산·배포하는 로직",
        "Per-router: 각 라우터가 라우팅 알고리즘을 직접 실행 (OSPF, BGP)",
        "Logically centralized (SDN): 원격 컨트롤러가 계산해 라우터에 설치",
      ],
      blocks: [
        { kind: "section", title: "데이터 평면과의 관계", body: "데이터 평면(4장)이 패킷을 '어디로 보낼지 표를 보고 실행'하는 층이라면, 제어 평면(5장)은 '그 표를 만드는' 층이다. 이 장 전체가 표를 만드는 두 가지 방법(분산 라우팅 vs SDN)의 이야기다." },
      ],
    },
    {
      idx: 1, title: "Chapter 2", sub: "라우팅 알고리즘 — Link State vs Distance Vector", pages: "7~25페이지", slides: [7, 25],
      intro: "그래프 추상화 위에서 최소 비용 경로를 찾는 두 축 — 전역 정보 기반 LS(Dijkstra)와 분산 반복 기반 DV(Bellman-Ford)를 비교합니다. 이 강의의 핵심 챕터입니다.",
      meta: "슬라이드 19장 · 판서 1장 · 녹음 22분 반영",
      summary: [
        "LS: 링크 상태를 플러딩 → 모두가 전체 지도 보유 → Dijkstra 실행",
        "Dijkstra: 매 라운드 최소 비용 노드를 N′에 편입, O(n²) (힙으로 개선)",
        "DV: Dx(y) = min over v { c(x,v) + Dv(y) } — 이웃과만 교환, 반복 수렴",
        "링크 비용 증가 시 count-to-infinity — poisoned reverse로 부분 완화",
        "비교: 메시지 복잡도·수렴 속도·오류 견고성에서 서로 트레이드오프",
      ],
      blocks: [
        { kind: "code", filename: "bellman_ford_update", code: "# Distance Vector (Bellman-Ford equation)\nDx(y) = min over v { c(x, v) + Dv(y) }\n# x: 자신, v: 이웃, y: 목적지\n# 이웃의 DV가 바뀔 때마다 재계산 → 수렴" },
        { kind: "table", headers: ["", "Link State", "Distance Vector"], rows: [
          ["정보 범위", "전체 토폴로지 (플러딩)", "이웃의 거리 벡터만"],
          ["계산", "Dijkstra (중앙집중식 계산)", "분산·반복 (Bellman-Ford)"],
          ["수렴", "O(n²) 메시지 후 빠름", "느릴 수 있음 · count-to-infinity"],
          ["오류 전파", "라우터가 자기 경로만 계산", "잘못된 비용이 네트워크로 전파"],
        ] },
        { kind: "handwriting", slide: 14, t: 880, photoId: "cn_ph1", caption: "Dijkstra 표 계산 판서 (u→z 단계별)" },
        { kind: "audio", slide: 23, t: 1480, text: "\"good news travels fast, bad news travels slow — 시험에 count-to-infinity 그림 꼭 나옵니다.\"" },
      ],
    },
    {
      idx: 2, title: "Chapter 3", sub: "확장 가능한 라우팅 — AS와 OSPF", pages: "26~32페이지", slides: [26, 32],
      intro: "수십억 목적지를 평면적으로 라우팅할 수는 없습니다. 자율 시스템(AS)으로 묶어 intra-AS와 inter-AS를 분리하는 인터넷의 계층화 전략을 다룹니다.",
      meta: "슬라이드 7장 · 녹음 9분 반영",
      summary: [
        "확장성: 평면 라우팅 불가 → AS(자율 시스템) 단위로 계층화",
        "intra-AS(도메인 내) vs inter-AS(도메인 간) 라우팅의 분리",
        "OSPF: 링크 상태 기반 intra-AS 프로토콜, 영역(area) 계층 지원",
      ],
      blocks: [
        { kind: "section", title: "OSPF의 위치", body: "OSPF는 AS 내부에서 LS 알고리즘을 돌리는 표준 프로토콜이다. 모든 라우터가 같은 지도를 갖고 Dijkstra를 돌리므로 관리자가 비용 정책을 통제하기 쉽다. 대규모 AS는 area로 쪼개 플러딩 범위를 줄인다." },
      ],
    },
    {
      idx: 3, title: "Chapter 4", sub: "BGP · ICMP · 네트워크 관리", pages: "33~52페이지", slides: [33, 52],
      intro: "인터넷의 접착제 BGP — 경로 벡터와 정책 라우팅, eBGP/iBGP, hot potato까지. 마지막으로 ICMP와 SNMP로 제어 평면을 마무리합니다.",
      meta: "슬라이드 20장 · 녹음 20분 반영",
      summary: [
        "BGP: 비용이 아니라 '경로(AS-PATH)'를 광고 — 정책이 최단경로를 이김",
        "eBGP(AS 간 세션) / iBGP(AS 내부 전파)의 역할 분담",
        "경로 선택: local preference → AS-PATH 길이 → hot potato(가까운 출구)",
        "ICMP: 오류·진단 (traceroute의 원리), SNMP: 장비 관리 프로토콜",
      ],
      blocks: [
        { kind: "section", title: "정책 라우팅", body: "BGP는 어떤 경로를 '광고할지'와 '수락할지'를 정책으로 정한다. 고객-공급자-피어 관계에 따라 광고를 제한하는 것이 인터넷 경제의 라우팅 반영이다. 기술적 최단이 아니라 사업적 선호가 우선한다." },
        { kind: "audio", slide: 42, t: 2760, text: "\"hot potato는 '내 네트워크에서 빨리 내보내기' — 라우팅 비용을 상대에게 떠넘기는 겁니다.\"" },
      ],
    },
  ],
  photos: [
    { id: "cn_ph1", slide: 14, t: 880, label: "판서 — Dijkstra 단계별 표" },
  ],
  overall: "제어 평면은 포워딩 테이블을 만드는 층입니다. AS 내부에서는 LS(OSPF)·DV 알고리즘이 최소 비용 경로를 계산하고, AS 사이에서는 BGP가 비용 대신 정책으로 경로를 고릅니다. Dijkstra 표 계산, DV 수렴(count-to-infinity), BGP 경로 선택 3가지가 시험 포인트입니다.",
  chaptersEn: [
    { title: "Chapter 1 — The Network Control Plane", summary: [
      "The control plane computes and installs forwarding tables.",
      "Per-router control (OSPF/BGP) vs logically centralized control (SDN).",
    ] },
    { title: "Chapter 2 — Routing: Link State vs Distance Vector", summary: [
      "LS floods topology so every router runs Dijkstra on the full map.",
      "DV iterates Dx(y) = min{c(x,v) + Dv(y)} with neighbors only.",
      "Count-to-infinity: bad news travels slowly in DV.",
    ] },
    { title: "Chapter 3 — Scalable Routing: AS & OSPF", summary: [
      "The Internet scales by aggregating routers into autonomous systems.",
      "OSPF is the standard link-state intra-AS protocol with area hierarchy.",
    ] },
    { title: "Chapter 4 — BGP · ICMP · Network Management", summary: [
      "BGP advertises AS paths; policy beats shortest path.",
      "Route choice: local preference, then AS-PATH length, then hot potato.",
      "ICMP powers traceroute; SNMP manages devices.",
    ] },
  ],
  overallEn: "The control plane builds forwarding tables: LS/DV algorithms compute least-cost paths inside an AS, while BGP picks inter-AS routes by policy rather than cost.",
};

/** lectureId → StudyData 매핑 (미등록 id는 ZK 데모로 폴백) */
const STUDY_MAP: Record<string, StudyData> = {
  w10: STUDY_ZK, is05: STUDY_ZK,
  bt05: STUDY_BT, bt04: STUDY_BT,
  cn05: STUDY_CN, cnref: STUDY_CN,
};

export const getStudyData = (lectureId: string): StudyData => ({
  ...(STUDY_MAP[lectureId] ?? STUDY_ZK),
  lectureId,
});
