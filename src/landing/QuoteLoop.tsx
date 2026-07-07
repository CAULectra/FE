/* ================================================================
   QuoteLoop — §3 학생 후기 (ReactBits Logo Loop 가로 2줄 버전)
   오버뷰 하단 풀폭 밴드: 후기 카드 8장이 2줄로 무한 순환.
   - 1줄은 왼쪽으로, 2줄은 오른쪽으로(reverse) 흐름
   - 속도 일정(px/s) → 세트 폭에서 duration 역산 (ResizeObserver)
   - hover 시 그 줄만 일시정지, 양옆 페이드아웃 마스크
   - reduced-motion이면 정적
   ================================================================ */
import { useEffect, useRef } from "react";

type Quote = { text: string; initials: string; name: string; role: string; bg: string };

const ROW1: Quote[] = [
  {
    text: "시험 전날 3배속으로 다시 듣던 걸 그만뒀어요. 교수님이 오래 머문 슬라이드만 골라 보니까 복습이 22분에 끝나요.",
    initials: "JH", name: "지현", role: "컴퓨터공학 3학년", bg: "var(--mint)",
  },
  {
    text: "칠판 수식이 그대로 LaTeX로 노트에 들어와요. 손으로 옮겨 적다가 첨자 틀리던 일이 없어졌어요.",
    initials: "DY", name: "도윤", role: "기계공학 3학년", bg: "#d6ecff",
  },
  {
    text: "필기 사진이 촬영 시각으로 노트에 자동 배치되는 게 진짜 편해요. 판서 놓친 날에도 친구 사진만 받으면 끝.",
    initials: "MJ", name: "민준", role: "전자공학 2학년", bg: "var(--citrus)",
  },
  {
    text: "재생하면 지금 문장에 하이라이트가 따라와요. 딴생각하다 돌아와도 어디 듣던 중인지 바로 찾아요.",
    initials: "HE", name: "하은", role: "통계학과 2학년", bg: "#e4dcff",
  },
];
const ROW2: Quote[] = [
  {
    text: "Q&A 답변에 인용 칩이 붙어서 원문을 바로 확인할 수 있어요. 챗봇 환각 때문에 불안했던 게 사라졌어요.",
    initials: "SY", name: "서연", role: "수학과 4학년", bg: "#ffd9d0",
  },
  {
    text: "녹음·슬라이드·판서를 따로 관리하다 폴더 지옥이었는데, 이제 업로드 한 번이면 한 강의로 묶여요.",
    initials: "JU", name: "준호", role: "소프트웨어학부 4학년", bg: "#ffe3cf",
  },
  {
    text: "이 설명이 몇 번 슬라이드였더라, 하고 헤매지 않아요. 문장을 누르면 그 슬라이드로 바로 점프해요.",
    initials: "SA", name: "수아", role: "화학과 3학년", bg: "#ffd6e6",
  },
  {
    text: "시험 주에 다시 듣기 4시간 걸리던 게 노트 훑기 40분으로 줄었어요. 과장 아니고 체감이에요.",
    initials: "TY", name: "태윤", role: "경영학부 1학년", bg: "var(--blush)",
  },
];
const SPEED = 40; // px/s — 클수록 빠름

function Cards({ items }: { items: Quote[] }) {
  return (
    <>
      {items.map((q) => (
        <article className="quote-card" key={q.initials}>
          <p>"{q.text}"</p>
          <div className="who">
            <span className="avatar" style={{ background: q.bg } as React.CSSProperties}>{q.initials}</span>
            <span>{q.name}<small>{q.role}</small></span>
          </div>
        </article>
      ))}
    </>
  );
}

function Row({ items, reverse = false }: { items: Quote[]; reverse?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const set = track.querySelector<HTMLElement>(".qband-set");
    if (!set) return;
    const sync = () => {
      track.style.setProperty("--qd", (set.offsetWidth / SPEED).toFixed(1) + "s");
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(set);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="qband-row">
      <div className={`qband-track${reverse ? " rev" : ""}`} ref={trackRef}>
        <div className="qband-set"><Cards items={items} /></div>
        <div className="qband-set" aria-hidden="true"><Cards items={items} /></div>
      </div>
    </div>
  );
}

export default function QuoteLoop() {
  return (
    <div className="quotes-band reveal" aria-label="Student testimonials">
      <div className="wrap"><div className="quotes-label">Students say</div></div>
      <Row items={ROW1} />
      <Row items={ROW2} reverse />
    </div>
  );
}
