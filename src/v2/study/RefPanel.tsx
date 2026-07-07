/* ================================================================
   RefPanel — 우측 패널 (초기 프로토타입 구조 = 3탭: 요약 / 번역 / 챗봇)
   - 요약: 챕터별 요약 카드 (클릭 → 해당 챕터로 이동) + 전체 총 요약
   - 번역: 번역된 내용만 깔끔하게 (원문 병기 없음)
   - 챗봇: RAG Q&A — 답변에 인용 칩(S#/시점) 필수, 칩 클릭 → 원문 점프
   밝은 톤: 흰 배경 + 라이트 세그먼트 탭
   ================================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, Image as ImageIcon, Languages, Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../app/components/ui/dialog";
import { ragQuickAction } from "../api";
import type { Photo, QAMessage, StudyData } from "../types";
import { fmtTime } from "../types";
import type { Playback } from "./playback";

export type RefTab = "summary" | "translate" | "photos" | "chat";

interface Props {
  data: StudyData;
  pb: Playback;
  activeChapter: number;
  onSelectChapter: (idx: number) => void;
  tab: RefTab;
  onTab: (t: RefTab) => void;
  qaMessages: QAMessage[];
  qaPending: boolean;
  qaDraft: string;
  onQaDraft: (v: string) => void;
  onSendQA: (q: string) => void;
  onPushQA: (m: QAMessage) => void;
  /** 노트에서 판서 언급을 눌렀을 때 포커스할 사진 */
  focusPhotoId: string | null;
}

const TABS: { key: RefTab; label: string; icon: React.ReactNode }[] = [
  { key: "summary", label: "요약", icon: <Sparkles size={12} /> },
  { key: "translate", label: "번역", icon: <Languages size={12} /> },
  { key: "photos", label: "사진", icon: <ImageIcon size={12} /> },
  { key: "chat", label: "챗봇", icon: <MessageSquare size={12} /> },
];

function CitationChips({ citations, pb, data }: { citations?: { slide: number; t?: number }[]; pb: Playback; data: StudyData }) {
  if (!citations?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
      <span className="text-[10px] text-muted-foreground">원문으로 이동 →</span>
    </div>
  );
}

export default function RefPanel(props: Props) {
  const { data, pb, activeChapter, onSelectChapter, tab, onTab, qaMessages, qaPending, qaDraft, onQaDraft, onSendQA, onPushQA, focusPhotoId } = props;
  const [quickPending, setQuickPending] = useState(false);
  const [targetLang, setTargetLang] = useState("English");
  const [photoOpen, setPhotoOpen] = useState<Photo | null>(null);
  const qaEndRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLButtonElement>(null);

  /* 노트에서 넘어온 사진 포커스 → 스크롤 */
  useEffect(() => {
    if (tab === "photos" && focusPhotoId) {
      focusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [tab, focusPhotoId]);

  useEffect(() => {
    if (tab === "chat") qaEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [qaMessages.length, qaPending, tab]);

  const activeIdx = useMemo(() => activeChapter, [activeChapter]);

  const quick = async (action: "summary" | "exam") => {
    if (quickPending) return;
    setQuickPending(true);
    onPushQA({ role: "user", text: action === "summary" ? `S${pb.activeSlideN} 이 슬라이드 요약해줘` : "예상 시험문제 3개 뽑아줘" });
    const ans = await ragQuickAction(data.lectureId, action, pb.activeSlideN);
    onPushQA(ans);
    setQuickPending(false);
  };

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-white">
      {/* 라이트 세그먼트 탭 */}
      <div className="border-b border-border px-3 py-2">
        <div className="flex gap-1 rounded-full bg-secondary p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11.5px] font-semibold transition-all ${
                tab === t.key ? "bg-white text-primary shadow-[0_1px_4px_rgba(28,25,23,0.10)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 요약 ===== */}
      {tab === "summary" && (
        <div className="ws-scroll flex-1 overflow-y-auto px-3.5 py-3">
          <div className="flex items-center gap-1.5 px-1 text-[12px] font-bold text-card-foreground">
            <BookOpen size={12} className="text-primary" /> 챕터별 요약
          </div>
          <div className="mt-2 space-y-2">
            {data.chapters.map((ch) => {
              const active = ch.idx === activeIdx;
              return (
                <button
                  key={ch.idx}
                  onClick={() => onSelectChapter(ch.idx)}
                  className={`block w-full rounded-xl border p-3 text-left transition-all ${
                    active ? "border-primary/50 bg-accent shadow-[0_0_0_3px_rgba(194,65,12,0.08)]" : "border-border bg-white hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10.5px] font-bold uppercase tracking-wide ${active ? "text-primary" : "text-muted-foreground"}`}>
                      {ch.title} <span className="ml-1 font-medium normal-case text-muted-foreground">{ch.pages}</span>
                    </span>
                    {active && (
                      <span className="flex items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[9.5px] font-bold text-white">
                        <Check size={9} strokeWidth={3} /> 슬라이드 표시
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-card-foreground">{ch.sub}</div>
                  <ul className="mt-1.5 space-y-1">
                    {ch.summary.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex gap-1.5 text-[11.5px] leading-relaxed text-foreground/80">
                        <span className="mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full bg-muted-foreground/60" />{s}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-1.5 px-1 text-[12px] font-bold text-card-foreground">
            <Sparkles size={12} className="text-[var(--ember)]" /> 전체 강의자료 총 요약
          </div>
          <div className="mt-2 rounded-xl border border-[#F0E3CE] bg-gradient-to-br from-[#FFFBF2] to-[#FEF7EA] p-3.5 text-[12.5px] leading-[1.75] text-foreground">
            {data.overall}
          </div>
        </div>
      )}

      {/* ===== 번역 (번역된 내용만) ===== */}
      {tab === "translate" && (
        <div className="ws-scroll flex-1 overflow-y-auto px-3.5 py-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-bold text-card-foreground">Chapter Summaries</span>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-secondary px-2 py-0.5 font-medium" title="노트 언어 자동 감지">자동 감지 · 한국어</span>
              <span>→</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="rounded-full border border-border bg-white px-2 py-0.5 text-[11px] font-semibold text-primary focus:outline-none"
              >
                <option>English</option><option>日本語</option><option>中文</option><option>Español</option>
              </select>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            {data.chaptersEn.map((ch, i) => (
              <button
                key={i}
                onClick={() => onSelectChapter(i)}
                className={`block w-full rounded-xl border p-3 text-left transition-all ${
                  i === activeIdx ? "border-primary/50 bg-accent" : "border-border bg-white hover:border-primary/30"
                }`}
              >
                <div className="text-[12px] font-semibold text-card-foreground">{ch.title}</div>
                <ul className="mt-1.5 space-y-1">
                  {ch.summary.map((s, j) => (
                    <li key={j} className="flex gap-1.5 text-[11.5px] leading-relaxed text-foreground/85">
                      <span className="mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full bg-muted-foreground/60" />{s}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-1.5 px-1 text-[12px] font-bold text-card-foreground">
            <Sparkles size={12} className="text-[var(--ember)]" /> Overall Summary
          </div>
          <div className="mt-2 rounded-xl border border-border bg-white p-3.5 text-[12.5px] leading-[1.75] text-foreground">
            {data.overallEn}
          </div>
          <p className="mt-3 px-1 text-[10px] text-muted-foreground/80">
            {targetLang !== "English" && <span className="text-[var(--warning)]">데모에서는 English 번역만 제공됩니다 · </span>}
            언어는 노트에서 자동 감지되며, 번역 결과는 노트 내보내기(Export)에 포함됩니다
          </p>
        </div>
      )}


      {/* ===== 사진 (업로드한 판서/필기 — 슬라이드 순 정렬) ===== */}
      {tab === "photos" && (
        <div className="ws-scroll flex-1 overflow-y-auto px-3.5 py-3">
          <div className="px-1 text-[12px] font-bold text-card-foreground">📷 업로드한 사진 <span className="ml-1 font-normal text-muted-foreground">{data.photos.length}장 · 슬라이드 순</span></div>
          <div className="mt-2 space-y-3">
            {[...data.photos].sort((a, b) => a.slide - b.slide).map((ph) => {
              const focused = ph.id === focusPhotoId;
              return (
                <button
                  key={ph.id}
                  ref={focused ? focusRef : undefined}
                  onClick={() => setPhotoOpen(ph)}
                  className={`block w-full overflow-hidden rounded-xl border bg-white text-left transition-all ${
                    focused ? "border-[var(--ember)] shadow-[0_0_0_3px_rgba(245,158,11,0.25)]" : "border-border hover:border-[var(--ember)]/60"
                  }`}
                >
                  {ph.img
                    ? <img src={ph.img} alt={ph.label} loading="lazy" className="h-36 w-full bg-[#FCFAF5] object-cover object-top" />
                    : <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[#F3EDE2] to-[#E9E0D0] text-[26px]">📷</div>}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-card-foreground">{ph.label}</span>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">S{ph.slide}</span>
                    {ph.t != null && (
                      <span
                        onClick={(e) => { e.stopPropagation(); pb.seek(ph.t!); }}
                        className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground hover:bg-primary hover:text-white"
                        title="이 시점으로 점프"
                      >
                        {fmtTime(ph.t)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 px-1 text-[10px] leading-relaxed text-muted-foreground/80">
            촬영 시각(EXIF)으로 슬라이드에 자동 매칭됩니다 · 클릭하면 원본 크게 보기
          </p>
        </div>
      )}

      {/* ===== 챗봇 ===== */}
      {tab === "chat" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-border bg-[#FBFAF8] px-3.5 py-1.5 text-[10.5px] text-muted-foreground">
            컨텍스트: 이 강의 전체 + 현재 슬라이드 (S{pb.activeSlideN})
          </div>
          <div className="ws-scroll flex-1 overflow-y-auto px-3.5 py-3">
            {qaMessages.map((m, i) => (
              <div key={i} className={`mb-2.5 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                  m.role === "user" ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-border bg-[#FBFAF8] text-foreground"
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
                placeholder="강의 내용을 질문해보세요…"
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
      {/* 사진 원본 크게 */}
      <Dialog open={!!photoOpen} onOpenChange={(o) => !o && setPhotoOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{photoOpen?.label} — S{photoOpen?.slide}{photoOpen?.t != null ? ` · ${fmtTime(photoOpen.t)}` : ""}</DialogTitle>
          </DialogHeader>
          {photoOpen?.img
            ? <img src={photoOpen.img} alt={photoOpen.label} className="max-h-[70vh] w-full rounded-xl bg-[#FCFAF5] object-contain" />
            : <div className="flex h-80 items-center justify-center rounded-xl bg-gradient-to-br from-[#F3EDE2] to-[#E5DBC8] text-[13px] text-muted-foreground">판서 사진 원본 (실연동 시 업로드 이미지)</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
