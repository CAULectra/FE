/* ================================================================
   RefPanel — 우측 참조 패널: 스크립트 / 사진 / Q&A / 번역
   - 스크립트: 카라오케 하이라이트 · 클릭 = 점프
   - Q&A: 답변에 인용 칩 필수(환각 방지) · 칩 클릭 → 원문 위치로
   - 번역: EN 원문 → KO, 섹션 단위 병렬 · 편집 가능 · 재번역
   ================================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenText, Image as ImageIcon, Languages, Loader2, MessageSquare, RefreshCcw, Send, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../app/components/ui/dialog";
import { ragQuickAction, translateSection } from "../api";
import type { Photo, QAMessage, StudyData } from "../types";
import { fmtTime } from "../types";
import type { Playback } from "./playback";

export type RefTab = "script" | "photos" | "qa" | "translate";

interface Props {
  data: StudyData;
  pb: Playback;
  docMode: boolean;
  tab: RefTab;
  onTab: (t: RefTab) => void;
  qaMessages: QAMessage[];
  qaPending: boolean;
  qaDraft: string;
  onQaDraft: (v: string) => void;
  onSendQA: (q: string) => void;
  onPushQA: (m: QAMessage) => void;
}

function CitationChips({ citations, pb, data }: { citations?: { slide: number; t?: number }[]; pb: Playback; data: StudyData }) {
  if (!citations?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {citations.map((c, i) => (
        <button
          key={i}
          onClick={() => pb.seek(c.t ?? data.slides.find((s) => s.n === c.slide)?.startSec ?? 0)}
          className="rounded-full border border-[#F0E3CE] bg-[#FFFBF2] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#92400E] transition-colors hover:bg-[var(--ember)] hover:text-white"
          title="원문으로 이동 →"
        >
          S{c.slide}{c.t != null ? ` / ${fmtTime(c.t)}` : ""}
        </button>
      ))}
      <span className="self-center text-[10px] text-muted-foreground">원문으로 이동 →</span>
    </div>
  );
}

export default function RefPanel(props: Props) {
  const { data, pb, docMode, tab, onTab, qaMessages, qaPending, qaDraft, onQaDraft, onSendQA, onPushQA } = props;
  const [photoOpen, setPhotoOpen] = useState<Photo | null>(null);
  const [quickPending, setQuickPending] = useState(false);
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const scriptActiveRef = useRef<HTMLButtonElement>(null);
  const qaEndRef = useRef<HTMLDivElement>(null);

  const tabs: { key: RefTab; label: string; icon: React.ReactNode }[] = [
    ...(!docMode ? [{ key: "script" as const, label: "스크립트", icon: <BookOpenText size={12} /> }] : []),
    { key: "photos", label: "사진", icon: <ImageIcon size={12} /> },
    { key: "qa", label: "Q&A", icon: <MessageSquare size={12} /> },
    { key: "translate", label: "번역", icon: <Languages size={12} /> },
  ];

  /* 카라오케: 현재 문장 */
  const activeSentenceId = useMemo(() => {
    const passed = data.script.filter((s) => s.t <= pb.currentTime);
    return passed.length ? passed[passed.length - 1].id : null;
  }, [data.script, pb.currentTime]);

  useEffect(() => {
    if (tab === "script" && pb.syncOn) scriptActiveRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeSentenceId, tab, pb.syncOn]);

  useEffect(() => {
    if (tab === "qa") qaEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [qaMessages.length, qaPending, tab]);

  /* 스크립트 + 사진을 시점순으로 머지 */
  const scriptItems = useMemo(() => {
    const items: ({ type: "sent"; t: number; id: string; slide: number; text: string } | { type: "photo"; t: number; photo: Photo })[] = [
      ...data.script.map((s) => ({ type: "sent" as const, ...s })),
      ...data.photos.filter((p) => p.t != null).map((p) => ({ type: "photo" as const, t: p.t!, photo: p })),
    ];
    return items.sort((a, b) => a.t - b.t);
  }, [data]);

  const quick = async (action: "summary" | "exam") => {
    setQuickPending(true);
    onPushQA({ role: "user", text: action === "summary" ? `S${pb.activeSlideN} 이 슬라이드 요약해줘` : "예상 시험문제 3개 뽑아줘" });
    const ans = await ragQuickAction(data.lectureId, action, pb.activeSlideN);
    onPushQA(ans);
    setQuickPending(false);
  };

  const retranslate = async (id: string, original: string) => {
    setTranslating((m) => ({ ...m, [id]: true }));
    const result = await translateSection(id, original);
    setTranslated((m) => ({ ...m, [id]: result }));
    setTranslating((m) => ({ ...m, [id]: false }));
  };

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-[#FBFAF8]">
      {/* 탭 토글 */}
      <div className="flex gap-1 border-b border-border px-3 py-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11.5px] font-semibold transition-colors ${
              tab === t.key ? "bg-[#17130F] text-white" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== 스크립트 ===== */}
      {tab === "script" && (
        <div className="ws-scroll flex-1 overflow-y-auto px-3.5 py-3">
          {scriptItems.map((item) =>
            item.type === "sent" ? (
              <button
                key={item.id}
                ref={item.id === activeSentenceId ? scriptActiveRef : undefined}
                onClick={() => pb.seek(item.t)}
                className={`block w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent ${item.id === activeSentenceId ? "script-active" : ""}`}
              >
                <span className="mr-2 text-[10.5px] font-semibold tabular-nums text-muted-foreground">{fmtTime(item.t)}</span>
                <span className="text-[12.5px] leading-relaxed text-foreground">{item.text}</span>
              </button>
            ) : (
              <button
                key={item.photo.id}
                onClick={() => setPhotoOpen(item.photo)}
                className="mt-1.5 flex w-full items-center gap-3 rounded-lg border border-[#F0E3CE] bg-[#FFFBF2] px-3 py-2 text-left hover:border-[var(--ember)]"
              >
                <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded bg-gradient-to-br from-[#F3EDE2] to-[#E9E0D0] text-[9px] text-muted-foreground">사진</div>
                <div>
                  <div className="text-[11.5px] font-semibold text-[#92400E]">{fmtTime(item.t)} 사진 — S{item.photo.slide} 구간</div>
                  <div className="text-[10.5px] text-muted-foreground">(사진 탭에서 모아보기)</div>
                </div>
              </button>
            ),
          )}
          <p className="mt-3 px-1 text-[10px] text-muted-foreground/80">현재 문장 자동 하이라이트 · 클릭 = 점프</p>
        </div>
      )}

      {/* ===== 사진 ===== */}
      {tab === "photos" && (
        <div className="ws-scroll flex-1 overflow-y-auto px-3.5 py-3">
          <div className="grid grid-cols-2 gap-2.5">
            {data.photos.map((p) => (
              <button key={p.id} onClick={() => setPhotoOpen(p)} className="rounded-lg border border-border bg-white p-2 text-left transition-colors hover:border-[var(--ember)]">
                <div className="flex h-20 items-center justify-center rounded bg-gradient-to-br from-[#F3EDE2] to-[#E9E0D0] text-[10px] text-muted-foreground">판서 사진</div>
                <div className="mt-1.5 text-[11px] font-medium text-card-foreground">{p.label}</div>
                <div className="text-[10px] text-muted-foreground">S{p.slide}{p.t != null ? ` · ${fmtTime(p.t)}` : ""}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 px-1 text-[10px] leading-relaxed text-muted-foreground/80">
            사진은 업로드 순서로 정렬 — 촬영시각(EXIF)이 있으면 슬라이드에 자동 매칭됩니다. 클릭하면 원본 크게 보기.
          </p>
        </div>
      )}

      {/* ===== Q&A ===== */}
      {tab === "qa" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-border bg-secondary/60 px-3.5 py-1.5 text-[10.5px] text-muted-foreground">
            컨텍스트: 이 강의 전체 + 현재 슬라이드 (S{pb.activeSlideN})
          </div>
          <div className="ws-scroll flex-1 overflow-y-auto px-3.5 py-3">
            {qaMessages.map((m, i) => (
              <div key={i} className={`mb-2.5 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                  m.role === "user" ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-border bg-white text-foreground"
                }`}>
                  <span className="whitespace-pre-line">{m.text}</span>
                  {m.role === "ai" && <CitationChips citations={m.citations} pb={pb} data={data} />}
                </div>
              </div>
            ))}
            {(qaPending || quickPending) && (
              <div className="flex items-center gap-2 px-1 text-[12px] text-muted-foreground">
                <Loader2 size={13} className="animate-spin" /> 강의 원문에서 근거를 찾는 중…
              </div>
            )}
            <div ref={qaEndRef} />
          </div>
          {/* 퀵 액션 */}
          <div className="flex gap-1.5 px-3.5 pb-1.5">
            <button onClick={() => quick("summary")} disabled={quickPending} className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/50 disabled:opacity-40">
              <Sparkles size={10} className="text-[var(--ember)]" /> 이 슬라이드 요약
            </button>
            <button onClick={() => quick("exam")} disabled={quickPending} className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/50 disabled:opacity-40">
              <Sparkles size={10} className="text-[var(--ember)]" /> 예상 시험문제 3개
            </button>
          </div>
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <input
                value={qaDraft}
                onChange={(e) => onQaDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && qaDraft.trim()) onSendQA(qaDraft.trim()); }}
                placeholder="질문 입력… (노트에서 보낸 질문도 여기로)"
                className="h-9 flex-1 rounded-lg border border-border bg-white px-3 text-[12.5px] placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(194,65,12,0.12)]"
              />
              <button
                disabled={!qaDraft.trim() || qaPending}
                onClick={() => onSendQA(qaDraft.trim())}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white hover:bg-[#9A3412] disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="mt-1.5 text-[9.5px] text-muted-foreground/80">답변은 항상 강의 원문 근거 + 인용 칩 (환각 방지)</p>
          </div>
        </div>
      )}

      {/* ===== 번역 ===== */}
      {tab === "translate" && (
        <div className="ws-scroll flex-1 overflow-y-auto px-3.5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              Target:
              <select className="rounded-md border border-border bg-white px-1.5 py-0.5 text-[11.5px] font-medium text-foreground focus:outline-none">
                <option>한국어</option><option>English</option><option>日本語</option>
              </select>
            </div>
            <button
              onClick={() => data.translations.forEach((s) => retranslate(s.id, s.original))}
              className="rounded-full bg-[#17130F] px-3 py-1 text-[11px] font-semibold text-white hover:bg-black"
            >
              모든 섹션 번역
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>원문 (EN)</span><span>번역 (KO) — 편집 가능</span>
          </div>
          {data.translations.map((s, i) => (
            <div key={s.id} className="mt-2 rounded-xl border border-border bg-white p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Section {i + 1} · S{s.slide}</span>
                <button
                  onClick={() => retranslate(s.id, s.original)}
                  disabled={!!translating[s.id]}
                  className="flex items-center gap-1 text-[10.5px] font-medium text-primary hover:underline disabled:opacity-40"
                >
                  {translating[s.id] ? <Loader2 size={10} className="animate-spin" /> : <RefreshCcw size={10} />} 재번역
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="rounded-lg bg-secondary/70 p-2 text-[11.5px] leading-relaxed text-muted-foreground">{s.original}</p>
                <textarea
                  defaultValue={translated[s.id] ?? s.translated}
                  key={translated[s.id] ?? s.id}
                  className="min-h-[90px] resize-none rounded-lg border border-border p-2 text-[11.5px] leading-relaxed text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          ))}
          <p className="mt-3 px-1 text-[10px] leading-relaxed text-muted-foreground/80">
            타임스탬프·S# 칩은 번역 후에도 유지 · 번역 결과는 Export에 포함됩니다
          </p>
        </div>
      )}

      {/* 사진 원본 크게 */}
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
