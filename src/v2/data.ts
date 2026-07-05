/* ================================================================
   Lectra v2 — 목 데이터 (와이어프레임 2.1/5.x의 예시 그대로)
   백엔드 연동 전까지의 시드. api.ts를 통해서만 소비한다.
   주의: script.t 는 반드시 해당 slide의 [startSec, endSec) 안에 있어야
   동기화(시간→슬라이드 매핑)가 성립한다.
   ================================================================ */
import type { Folder, Lecture, StudyData } from "./types";

export const SEED_FOLDERS: Folder[] = [
  { id: "ds", name: "Data Structures" },
  { id: "ai", name: "AI Seminar" },
  { id: "os", name: "Operating Systems" },
];

export const SEED_LECTURES: Lecture[] = [
  { id: "w11", title: "Week 11 - Hashing",  folderId: "ds", uploadedAt: "2026-07-02", updatedLabel: "Jul 2",  status: "processing", progress: 45, stepIndex: 1, etaMin: 6, slideCount: 18, audioSec: 3480, photoCount: 2, hasAudio: true },
  { id: "w10", title: "Week 10 - B-Trees",  folderId: "ds", uploadedAt: "2026-06-28", updatedLabel: "Jun 28", status: "ready", progress: 100, stepIndex: 5, slideCount: 14, audioSec: 3690, photoCount: 2, hasAudio: true },
  { id: "w9",  title: "Week 9 - AVL Trees", folderId: "ds", uploadedAt: "2026-06-21", updatedLabel: "Jun 21", status: "ready", progress: 100, stepIndex: 5, slideCount: 21, audioSec: 4020, photoCount: 0, hasAudio: true },
  { id: "w8",  title: "Week 8 - Heaps",     folderId: "ds", uploadedAt: "2026-06-14", updatedLabel: "Jun 14", status: "ready", progress: 100, stepIndex: 5, slideCount: 16, audioSec: 3300, photoCount: 1, hasAudio: true },
  { id: "w7",  title: "Week 7 - BST",       folderId: "ds", uploadedAt: "2026-06-07", updatedLabel: "Jun 7",  status: "ready", progress: 100, stepIndex: 5, slideCount: 19, audioSec: 3540, photoCount: 0, hasAudio: true },
  { id: "w6",  title: "Week 6 - Recursion", folderId: "ds", uploadedAt: "2026-05-31", updatedLabel: "May 31", status: "failed", progress: 34, stepIndex: 1, failedStep: 1, errorCode: "STT_TIMEOUT", slideCount: 12, audioSec: 2880, photoCount: 0, hasAudio: true },
  { id: "tf",  title: "Transformer Basics", folderId: "ai", uploadedAt: "2026-06-30", updatedLabel: "Jun 30", status: "processing", progress: 88, stepIndex: 4, etaMin: 2, slideCount: 24, audioSec: 5100, photoCount: 0, hasAudio: true },
  { id: "attn",title: "Attention Is All You Need", folderId: "ai", uploadedAt: "2026-06-24", updatedLabel: "Jun 24", status: "ready", progress: 100, stepIndex: 5, slideCount: 15, audioSec: 0, photoCount: 4, hasAudio: false },
  { id: "ptlb",title: "Paging & TLB",       folderId: "os", uploadedAt: "2026-07-01", updatedLabel: "Jul 1",  status: "failed", progress: 52, stepIndex: 2, failedStep: 2, errorCode: "PDF_PARSE_ERROR", slideCount: 22, audioSec: 3900, photoCount: 0, hasAudio: true },
  { id: "w12", title: "Week 12 - Graphs",   folderId: "ds", uploadedAt: "2026-07-04", updatedLabel: "Jul 4",  status: "queued", progress: 0, stepIndex: 0, queueOrder: 2, slideCount: 20, audioSec: 3600, photoCount: 0, hasAudio: true },
];

/* ---------------- Week 10 - B-Trees 상세 (Study 목업) ----------------
   총 61:30(3690s). 교수가 S12에 23:00(1380s)쯤 도달하는 시나리오.
   S14는 요약+문제풀이+질의응답으로 길다(강의 후반부 통짜 구간).      */

const S = (n: number, title: string, startSec: number, endSec: number, dwellProf: number, isBoard = false) =>
  ({ n, title, startSec, endSec, dwellProf, isBoard });

export const STUDY_W10: StudyData = {
  lectureId: "w10",
  durationSec: 3690, // 61:30
  slides: [
    S(1, "Course logistics", 0, 126, 126),
    S(2, "Recap: Balanced trees", 126, 252, 126),
    S(3, "Why B-Trees?", 252, 378, 200),
    S(4, "Disk access model", 378, 504, 180),
    S(5, "B-Tree definition", 504, 630, 260),
    S(6, "Order and height", 630, 756, 160),
    S(7, "Search in B-Trees", 756, 882, 150),
    S(8, "Search example", 882, 1008, 126),
    S(9, "Insertion overview", 1008, 1134, 210),
    S(10, "Node overflow", 1134, 1260, 240),
    S(11, "Split operation", 1260, 1380, 220, true),
    S(12, "B-Tree insertion", 1380, 1500, 420),
    S(13, "Split example", 1500, 1680, 900),        // 15분 ★ 최다 체류 (시험 포인트)
    S(14, "Summary · Exercises · Q&A", 1680, 3690, 300),
  ],
  script: [
    { id: "sc1", slide: 12, t: 1382, text: "...so when the node overflows, we cannot just append the key." },
    { id: "sc2", slide: 12, t: 1394, text: "The median moves up to the parent — height stays logarithmic." },
    { id: "sc3", slide: 12, t: 1406, text: "Let's see a split example on the next slide..." },
    { id: "sc4", slide: 12, t: 1430, text: "Notice both halves keep at least half of the keys after the split." },
    { id: "sc5", slide: 13, t: 1502, text: "Here the key 42 arrives and the leaf is already full." },
    { id: "sc6", slide: 13, t: 1531, text: "We split around the median key, and 37 is promoted." },
    { id: "sc7", slide: 13, t: 1560, text: "Only a root split ever increases the height of the tree." },
    { id: "sc8", slide: 14, t: 1700, text: "To summarize: B-Trees trade node size for shallow height." },
  ],
  notes: [
    { kind: "heading", slide: 12, t: 1394, text: "S12 · B-Tree insertion" },
    { kind: "bullet", slide: 12, text: "노드가 가득 차면 중앙값 기준 분할" },
    { kind: "bullet", slide: 12, text: "중앙값만 부모로 승격 — 높이 로그 유지" },
    { kind: "bullet", slide: 12, text: "루트 분할 시에만 높이 +1" },
    { kind: "photo", slide: 12, t: 1420, photoId: "ph1", caption: "23:40 촬영 → 이 위치에 자동 삽입 · 클릭하면 원본 크게 보기" },
    { kind: "heading", slide: 13, t: 1502, text: "S13 · Split example" },
    { kind: "bullet", slide: 13, text: "분할 전/후 키 분포 예시" },
    { kind: "bullet", slide: 13, text: "키 42 삽입 → 리프 오버플로 → 중앙값 37 승격" },
    { kind: "memo", slide: 13, text: "내 질문: 왜 하필 중앙값?" },
    { kind: "heading", slide: 14, t: 1700, text: "S14 · Summary" },
    { kind: "bullet", slide: 14, text: "B-Tree = 디스크 블록 크기에 노드를 맞춰 트리 높이를 최소화" },
  ],
  photos: [
    { id: "ph1", slide: 12, t: 1420, label: "판서 — 분할 과정 손그림" },
    { id: "ph2", slide: 13, t: 1545, label: "판서 — 승격 후 트리 모양" },
  ],
  translations: [
    { id: "tr1", slide: 12, original: "When a node overflows, we split it around the median key. The median moves up to the parent, so the height of the tree stays logarithmic.", translated: "노드가 가득 차 넘치면 중앙값 키를 기준으로 분할합니다. 중앙값이 부모로 올라가므로 트리 높이는 로그 수준으로 유지됩니다." },
    { id: "tr2", slide: 13, original: "Key 42 arrives at a full leaf. We split around the median, and key 37 is promoted to the parent node.", translated: "키 42가 가득 찬 리프에 도착합니다. 중앙값 기준으로 분할하고, 키 37이 부모 노드로 승격됩니다." },
    { id: "tr3", slide: 14, original: "B-Trees trade larger node size for shallow height, matching the disk block access model.", translated: "B-Tree는 노드 크기를 키우는 대신 트리 높이를 낮춰, 디스크 블록 접근 모델에 최적화합니다." },
  ],
};

/** ready 상태인 다른 강의는 W10 데이터를 재사용 (데모) */
export const getStudyData = (lectureId: string): StudyData => ({ ...STUDY_W10, lectureId });
