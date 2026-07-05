/* ================================================================
   NotePane — 중앙 노트 (챕터 단위)
   사람이 정리한 노트 같은 톤: 조용한 타이포 + LaTeX 수식(KaTeX) +
   프로토콜 다이어그램(SVG). 판서/녹음 앵커는 슬림한 참조 행으로.
   ================================================================ */
import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Chapter, NoteBlock, StudyData } from "../types";
import { fmtTime } from "../types";
import type { Playback } from "./playback";

/* ---- LaTeX 수식 (KaTeX) ---- */
function MathBlock({ latex, caption }: { latex: string; caption?: string }) {
  const html = useMemo(
    () => katex.renderToString(latex, { displayMode: true, throwOnError: false }),
    [latex],
  );
  return (
    <figure className="my-4">
      <div
        className="ws-scroll overflow-x-auto rounded-lg bg-[#FCFAF5] px-4 py-3 text-[14.5px] text-[#292524]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {caption && <figcaption className="mt-1 text-center text-[11px] text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

/* ---- Schnorr 3-move 시퀀스 다이어그램 (SVG) ---- */
function SchnorrFlow() {
  const P = 110, V = 440, W = 550;
  const arrow = (y: number, from: number, to: number, label: string, above = true) => (
    <g key={label}>
      <line x1={from} y1={y} x2={to} y2={y} stroke="#C2410C" strokeWidth="1.5" markerEnd="url(#arr)" />
      <text x={(from + to) / 2} y={above ? y - 7 : y + 15} textAnchor="middle" fontSize="12"
        fontFamily="ui-monospace, monospace" fill="#44403C">{label}</text>
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} 220`} className="w-full">
      <defs>
        <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#C2410C" />
        </marker>
      </defs>
      {/* 라이프라인 */}
      {[{ x: P, name: "P (증명자)", sub: "비밀 x 보유" }, { x: V, name: "V (검증자)", sub: "공개값 y = gˣ" }].map((a) => (
        <g key={a.name}>
          <rect x={a.x - 62} y={8} width={124} height={38} rx={9} fill="#FFF" stroke="#E8E4DE" />
          <text x={a.x} y={24} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1C1917">{a.name}</text>
          <text x={a.x} y={38} textAnchor="middle" fontSize="9.5" fill="#797067">{a.sub}</text>
          <line x1={a.x} y1={46} x2={a.x} y2={200} stroke="#E8E4DE" strokeDasharray="3 4" />
        </g>
      ))}
      {arrow(84, P + 4, V - 4, "① β = gᵅ  (커밋)")}
      {arrow(128, V - 4, P + 4, "② c ←$ Zq  (챌린지)")}
      {arrow(172, P + 4, V - 4, "③ s = xc + α  (응답)")}
      <text x={V} y={206} textAnchor="middle" fontSize="10.5" fontFamily="ui-monospace, monospace" fill="#92400E">
        검증: gˢ ≟ yᶜ·β
      </text>
    </svg>
  );
}

interface Props {
  data: StudyData;
  pb: Playback;
  docMode: boolean;
  chapter: Chapter;
  onSelectChapter: (idx: number) => void;
  /** 노트의 판서 언급 클릭 → 우측 '사진' 탭에서 해당 사진 포커스 */
  onPhotoRef: (photoId: string) => void;
}

export default function NotePane({ data, pb, docMode, chapter, onSelectChapter, onPhotoRef }: Props) {

  const renderBlock = (b: NoteBlock, i: number) => {
    switch (b.kind) {
      case "section":
        return (
          <div key={i} className="mt-7">
            <h4 className="text-[15px] font-bold tracking-tight text-[#1C1917]">{b.title}</h4>
            <p className="mt-2 text-[13.5px] leading-[1.85] text-[#44403C]">{b.body}</p>
          </div>
        );
      case "bullets":
        return (
          <ul key={i} className="mt-3 space-y-1.5">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-2.5 text-[13.5px] leading-[1.8] text-[#44403C]">
                <span className="mt-[10px] h-[3px] w-[3px] shrink-0 rounded-full bg-[#A8A29E]" />{item}
              </li>
            ))}
          </ul>
        );
      case "callout":
        return (
          <div key={i} className="mt-4 flex items-start gap-3 rounded-xl bg-[#F7F3EC] px-4 py-3">
            <span className="mt-0.5 text-[16px] leading-none">{b.emoji}</span>
            <p className="text-[12.5px] leading-[1.8] text-[#44403C]">{b.text}</p>
          </div>
        );
      case "math":
        return <MathBlock key={i} latex={b.latex} caption={b.caption} />;
      case "viz":
        return (
          <figure key={i} className="my-5 rounded-xl border border-border bg-white p-4">
            {b.viz === "schnorr-flow" && <SchnorrFlow />}
            {b.caption && <figcaption className="mt-1 text-center text-[11px] text-muted-foreground">{b.caption}</figcaption>}
          </figure>
        );
      case "code":
        return (
          <div key={i} className="mt-4 overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border bg-[#FCFAF5] px-3.5 py-1.5 font-mono text-[10.5px] text-muted-foreground">{b.filename}</div>
            <pre className="ws-scroll overflow-x-auto bg-white px-4 py-3 font-mono text-[12px] leading-[1.75] text-[#44403C]">{b.code}</pre>
          </div>
        );
      case "table":
        return (
          <div key={i} className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-[#FCFAF5]">
                  {b.headers.map((h, j) => (
                    <th key={j} className="px-3 py-2 text-left text-[11px] font-bold text-[#57534E]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, r) => (
                  <tr key={r} className="border-t border-border">
                    {row.map((cell, c) => (
                      <td key={c} className="px-3 py-2 text-[#44403C]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "handwriting": {
        return (
          <button
            key={i}
            onClick={() => onPhotoRef(b.photoId)}
            title="사진 탭에서 보기"
            className="mt-4 flex w-full items-center gap-2.5 rounded-xl bg-[#FBF4E8] px-4 py-3 text-left transition-all hover:shadow-[0_2px_10px_rgba(146,64,14,0.12)]"
          >
            <span className="text-[15px] leading-none">📷</span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#57534E]">
              <b className="font-semibold text-[#44403C]">판서 사진</b> · {b.caption}
            </span>
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">S{b.slide}</span>
            {b.t != null && !docMode && (
              <span
                onClick={(e) => { e.stopPropagation(); pb.seek(b.t!); }}
                className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground hover:bg-primary hover:text-white"
              >
                {fmtTime(b.t)}
              </span>
            )}
            <span className="shrink-0 text-[10px] font-semibold text-[#B45309]">사진 탭 →</span>
          </button>
        );
      }
      case "audio":
        return (
          <button
            key={i}
            onClick={() => !docMode && pb.seek(b.t)}
            className="mt-2 flex w-full items-start gap-2.5 rounded-xl bg-[#F4F1FA] px-4 py-3 text-left transition-all hover:shadow-[0_2px_10px_rgba(124,58,237,0.12)]"
          >
            <span className="text-[15px] leading-none">🎙️</span>
            <span className="min-w-0 flex-1 text-[12.5px] italic leading-[1.75] text-[#57534E]">{b.text}</span>
            {!docMode && (
              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">{fmtTime(b.t)}</span>
            )}
          </button>
        );
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-white">
      {/* 헤더: 노트 + 챕터 페이저 */}
      <div className="flex items-center justify-between border-b border-border px-5 py-2">
        <span className="text-[12px] font-semibold text-card-foreground">노트</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelectChapter(chapter.idx - 1)}
            disabled={chapter.idx === 0}
            className="rounded-md border border-border p-1 text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[12px] font-medium tabular-nums text-muted-foreground">{chapter.idx + 1} / {data.chapters.length}</span>
          <button
            onClick={() => onSelectChapter(chapter.idx + 1)}
            disabled={chapter.idx === data.chapters.length - 1}
            className="rounded-md border border-border p-1 text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="ws-scroll flex-1 overflow-y-auto px-8 py-7">
        <div className="mx-auto max-w-[660px] pb-16">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
            {chapter.title} <span className="ml-1 font-medium normal-case tracking-normal text-muted-foreground">· {chapter.pages}</span>
          </div>
          <h1 className="mt-2 text-[25px] font-bold leading-snug tracking-tight text-[#1C1917]">{chapter.sub}</h1>
          <p className="mt-2.5 text-[13.5px] leading-[1.85] text-[#57534E]">{chapter.intro}</p>
          <p className="mt-1.5 text-[11px] text-muted-foreground/80">{chapter.meta}</p>

          {/* 요약 — 노션식 콜아웃 */}
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#FCF7EE] px-4 py-3.5">
            <span className="mt-0.5 text-[17px] leading-none">💡</span>
            <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#92400E]">요약</div>
            <ul className="mt-2 space-y-1.5">
              {chapter.summary.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[12.5px] leading-[1.75] text-[#44403C]">
                  <span className="mt-[9px] h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--ember)]" />{s}
                </li>
              ))}
            </ul>
            </div>
          </div>

          {chapter.blocks.map(renderBlock)}
        </div>
      </div>

    </div>
  );
}
