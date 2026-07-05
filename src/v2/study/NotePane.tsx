/* ================================================================
   NotePane — 중앙 "AI 정리본" (Figma Make 버전 구조 = 챕터 단위)
   헤더: AI 정리본 + Chapter 배지 + 챕터 페이저 (◀ n/4 ▶)
   본문: 챕터 인트로/메타 → 핵심 요약 박스 → 노트 블록
   블록(판서/녹음)은 S#·시점 앵커 → 클릭 시 좌/타임라인 점프
   ================================================================ */
import { useState } from "react";
import { ChevronLeft, ChevronRight, Mic, PenLine, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../app/components/ui/dialog";
import type { Chapter, NoteBlock, Photo, StudyData } from "../types";
import { fmtTime } from "../types";
import type { Playback } from "./playback";

interface Props {
  data: StudyData;
  pb: Playback;
  docMode: boolean;
  chapter: Chapter;
  onSelectChapter: (idx: number) => void;
}

export default function NotePane({ data, pb, docMode, chapter, onSelectChapter }: Props) {
  const [photoOpen, setPhotoOpen] = useState<Photo | null>(null);

  const renderBlock = (b: NoteBlock, i: number) => {
    switch (b.kind) {
      case "section":
        return (
          <div key={i} className="mt-6">
            <h4 className="text-[14.5px] font-bold text-card-foreground">{b.title}</h4>
            <p className="mt-1.5 text-[13px] leading-[1.75] text-foreground">{b.body}</p>
          </div>
        );
      case "bullets":
        return (
          <ul key={i} className="mt-3 space-y-1.5">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-2 text-[13px] leading-relaxed text-foreground">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary/60" />{item}
              </li>
            ))}
          </ul>
        );
      case "code":
        return (
          <div key={i} className="mt-4 overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-secondary/70 px-3.5 py-1.5 text-[10.5px] font-semibold tracking-wide text-muted-foreground">
              {b.filename}
            </div>
            <pre className="ws-scroll overflow-x-auto bg-[#FDFCFA] px-4 py-3 font-mono text-[12px] leading-[1.7] text-[#44403C]">{b.code}</pre>
          </div>
        );
      case "table":
        return (
          <div key={i} className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-[rgba(194,65,12,0.05)]">
                  {b.headers.map((h, j) => (
                    <th key={j} className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-primary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, r) => (
                  <tr key={r} className="border-t border-border">
                    {row.map((cell, c) => (
                      <td key={c} className="px-3 py-2 text-foreground">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "handwriting": {
        const photo = data.photos.find((p) => p.id === b.photoId);
        return (
          <button
            key={i}
            onClick={() => photo && setPhotoOpen(photo)}
            className="mt-4 flex w-full items-center gap-3.5 rounded-xl border border-[#F0E3CE] bg-[#FFFBF2] px-3.5 py-3 text-left transition-colors hover:border-[var(--ember)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ember-soft)] text-[#92400E]"><PenLine size={15} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#92400E]">
                판서 기반 분석
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-muted-foreground">슬라이드 {b.slide}</span>
              </div>
              <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{b.caption} · 클릭하면 원본 크게 보기</div>
            </div>
            {b.t != null && !docMode && (
              <span onClick={(e) => { e.stopPropagation(); pb.seek(b.t!); }}
                className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground hover:bg-primary hover:text-white">
                {fmtTime(b.t)}
              </span>
            )}
          </button>
        );
      }
      case "audio":
        return (
          <button
            key={i}
            onClick={() => !docMode && pb.seek(b.t)}
            className="mt-4 flex w-full items-center gap-3.5 rounded-xl border border-[#E9E2F5] bg-[#FBFAFE] px-3.5 py-3 text-left transition-colors hover:border-[#8B5CF6]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1EBFB] text-[#7C3AED]"><Mic size={15} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#6D28D9]">
                녹음 보충설명
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-muted-foreground">슬라이드 {b.slide}</span>
              </div>
              <div className="mt-0.5 text-[12px] italic leading-relaxed text-foreground/80">{b.text}</div>
            </div>
            {!docMode && (
              <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">{fmtTime(b.t)}</span>
            )}
          </button>
        );
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-white">
      {/* 헤더: AI 정리본 + 챕터 페이저 */}
      <div className="flex items-center justify-between border-b border-border px-5 py-2">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[var(--ember)]" />
          <span className="text-[12px] font-semibold text-card-foreground">AI 정리본</span>
          <span className="rounded-full bg-[var(--ember-soft)] px-2 py-0.5 text-[10.5px] font-bold text-[#92400E]">{chapter.title}</span>
          <span className="hidden text-[11px] text-muted-foreground lg:block">슬라이드 · 판서 · 녹음 통합 분석</span>
        </div>
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
      <div className="ws-scroll flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-[680px] pb-16">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10.5px] font-bold text-white">{chapter.title}</span>
            <span className="text-[11.5px] text-muted-foreground">{chapter.pages}</span>
          </div>
          <h1 className="mt-2.5 text-[24px] font-bold leading-snug tracking-tight text-card-foreground">{chapter.sub}</h1>
          <p className="mt-2 text-[13.5px] leading-[1.75] text-foreground/85">{chapter.intro}</p>
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">{chapter.meta}</p>

          {/* 핵심 요약 */}
          <div className="mt-5 rounded-xl border border-[#F0E3CE] bg-gradient-to-br from-[#FFFBF2] to-[#FEF7EA] p-4">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#92400E]">
              <Sparkles size={12} /> 핵심 요약
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {chapter.summary.map((s, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-foreground">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--ember)]" />{s}
                </li>
              ))}
            </ul>
          </div>

          {/* 노트 블록 */}
          {chapter.blocks.map(renderBlock)}
        </div>
      </div>

      {/* 사진 원본 크게 보기 */}
      <Dialog open={!!photoOpen} onOpenChange={(o) => !o && setPhotoOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{photoOpen?.label} — S{photoOpen?.slide}{photoOpen?.t != null ? ` · ${fmtTime(photoOpen.t)}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="flex h-80 items-center justify-center rounded-xl bg-gradient-to-br from-[#F3EDE2] to-[#E5DBC8] text-[13px] text-muted-foreground">
            판서 사진 원본 (실연동 시 업로드 이미지)
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
