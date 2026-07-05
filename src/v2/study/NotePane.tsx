/* ================================================================
   NotePane — 중앙 "내 노트" (AI 초안 + 내 편집)
   모든 블록이 S#·시점에 앵커링: 헤딩 TS 칩 클릭 → 좌/우/타임라인 점프
   툴바: HL(형광펜) / B / img / TS — 선택 영역에 적용
   ================================================================ */
import { useEffect, useRef, useState } from "react";
import { Bold, Clock3, Highlighter, ImagePlus, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../app/components/ui/dialog";
import type { Lecture, NoteBlock, Photo, StudyData } from "../types";
import { fmtTime } from "../types";
import type { Playback } from "./playback";

interface Props {
  lecture: Lecture;
  data: StudyData;
  pb: Playback;
  docMode: boolean;
  onAskQA: (question: string) => void;
}

export default function NotePane({ lecture, data, pb, docMode, onAskQA }: Props) {
  const [photoOpen, setPhotoOpen] = useState<Photo | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeHeadingRef = useRef<HTMLDivElement>(null);
  const suppress = useRef(false);

  /* 동기화: 활성 슬라이드의 노트 헤딩으로 자동 스크롤 */
  useEffect(() => {
    if (!pb.syncOn || docMode) return;
    suppress.current = true;
    activeHeadingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    const t = setTimeout(() => { suppress.current = false; }, 600);
    return () => clearTimeout(t);
  }, [pb.activeSlideN, pb.syncOn, docMode]);

  const exec = (cmd: "hl" | "bold" | "ts" | "img") => {
    if (cmd === "bold") document.execCommand("bold");
    if (cmd === "hl") document.execCommand("hiliteColor", false, "#FDE68A");
    if (cmd === "ts") document.execCommand("insertText", false, ` [${fmtTime(pb.currentTime)}] `);
  };

  const renderBlock = (b: NoteBlock, i: number) => {
    const isActive = b.slide === pb.activeSlideN && !docMode;
    switch (b.kind) {
      case "heading":
        return (
          <div
            key={i}
            ref={isActive ? activeHeadingRef : undefined}
            className={`mt-7 flex items-center justify-between rounded-lg px-2 py-1 first:mt-0 ${isActive ? "bg-[var(--ember-soft)]" : ""}`}
          >
            <h3 className="text-[15.5px] font-bold text-card-foreground">{b.text}</h3>
            {b.t != null && !docMode && (
              <button
                onClick={() => pb.seek(b.t!)}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground transition-colors hover:bg-primary hover:text-white"
                title="클릭 → 이 시점으로 점프"
              >
                {fmtTime(b.t)}
              </button>
            )}
          </div>
        );
      case "bullet":
        return (
          <div
            key={i}
            contentEditable
            suppressContentEditableWarning
            className="note-editable ml-2 mt-1.5 rounded px-2 py-0.5 text-[13.5px] leading-relaxed text-foreground focus:bg-accent/60"
          >
            • {b.text}
          </div>
        );
      case "photo": {
        const photo = data.photos.find((p) => p.id === b.photoId);
        return (
          <button
            key={i}
            onClick={() => photo && setPhotoOpen(photo)}
            className="ml-2 mt-3 flex w-[calc(100%-8px)] items-center gap-3.5 rounded-xl border border-[#F0E3CE] bg-[#FFFBF2] px-3.5 py-3 text-left transition-colors hover:border-[var(--ember)]"
          >
            <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F3EDE2] to-[#E9E0D0] text-[10px] text-muted-foreground">사진</div>
            <div>
              <div className="text-[12.5px] font-semibold text-[#92400E]">필기 사진 · S{b.slide}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">{b.caption}</div>
            </div>
          </button>
        );
      }
      case "memo":
        return (
          <div key={i} className="ml-2 mt-3 rounded-xl border-2 border-dashed border-border bg-[#FBFAF8] px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <span
                contentEditable
                suppressContentEditableWarning
                className="note-editable flex-1 text-[13px] text-foreground"
              >
                {b.text}
              </span>
              <button
                onClick={() => onAskQA(b.text.replace(/^내 질문:\s*/, ""))}
                className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#9A3412]"
              >
                <Send size={10} /> Q&A으로 보내기
              </button>
            </div>
            <div className="mt-1 text-[10.5px] text-muted-foreground">메모 블록 — 시험 전 ‘내 질문만 모아보기’ 필터</div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
      {/* 헤더 + 툴바 */}
      <div className="flex items-center justify-between border-b border-border px-5 py-2">
        <div className="text-[12px] font-semibold text-card-foreground">내 노트 <span className="ml-1 font-normal text-muted-foreground">AI 초안 + 내 편집</span></div>
        <div className="flex items-center gap-1">
          {[
            { k: "hl" as const, icon: <Highlighter size={13} />, tip: "형광펜 (선택 영역)" },
            { k: "bold" as const, icon: <Bold size={13} />, tip: "굵게" },
            { k: "img" as const, icon: <ImagePlus size={13} />, tip: "사진 삽입 — 사진 탭에서 드래그 (준비 중)" },
            { k: "ts" as const, icon: <Clock3 size={13} />, tip: "현재 재생 시점 삽입" },
          ].map((b) => (
            <button
              key={b.k}
              title={b.tip}
              onMouseDown={(e) => { e.preventDefault(); exec(b.k); }}
              className="rounded-md border border-border bg-card p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <div
        ref={scrollRef}
        onWheel={() => { if (!suppress.current && !docMode) pb.breakSync(); }}
        className="ws-scroll flex-1 overflow-y-auto px-7 py-5"
      >
        <h1 className="text-[22px] font-bold tracking-tight text-card-foreground">{lecture.title.replace(" - ", " — ")}</h1>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {docMode
            ? `슬라이드 ${data.slides.length}장 · 녹음 없음 (문서 모드) · AI 초안 + 내 편집`
            : `자료구조 · ${lecture.updatedLabel} · ${fmtTime(data.durationSec)} · AI 초안 + 내 편집`}
        </p>

        <div className="mt-4 pb-16">
          {data.notes.map(renderBlock)}
          <p className="mt-10 rounded-lg bg-secondary px-3 py-2 text-center text-[10.5px] text-muted-foreground">
            {docMode
              ? "녹음 없음: 노트 줄은 슬라이드에만 앵커링 (시점 없음) · 히트맵 소스=나"
              : "모든 줄·형광펜·사진이 슬라이드·시점에 앵커링 — 시점 칩 클릭 시 좌/우가 따라옵니다"}
          </p>
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
