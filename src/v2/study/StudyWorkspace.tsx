/* ================================================================
   StudyWorkspace — 3-pane + 하단 정렬 타임라인
   B 슬라이드(실제 PDF 렌더) · C AI 정리본(챕터 단위) · D 요약/번역/챗봇
   문서 모드(녹음 없음): 타임라인 숨김 + '+ 녹음 추가'
   ================================================================ */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AlertTriangle, CheckCircle2, ChevronLeft, Download, Loader2, Mic } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../../app/components/ui/dropdown-menu";
import { EXPORT_FORMATS, fetchStudyData, ragQA, requestExport } from "../api";
import { useApp } from "../store";
import { chapterOfSlide, type Lecture, type QAMessage, type StudyData } from "../types";
import { usePlayback } from "./playback";
import SlideStrip from "./SlideStrip";
import NotePane from "./NotePane";
import RefPanel, { type RefTab } from "./RefPanel";
import Timeline from "./Timeline";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface Toast { id: number; text: string; done?: boolean }

/* 패널 사이 드래그 핸들 — 경계를 눌러 좌우 크기 조절 */
function ResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/40 data-[resize-handle-state=drag]:bg-primary">
      <span className="absolute inset-y-0 -left-1 -right-1" />
    </PanelResizeHandle>
  );
}

export default function StudyWorkspace({ lecture }: { lecture: Lecture }) {
  const [data, setData] = useState<StudyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();

  // 실모드: fetchStudyData가 미완료/네트워크/인증 에러로 throw할 수 있음 → 반드시 catch.
  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetchStudyData(lecture.id)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "강의를 불러오지 못했습니다."); });
    return () => { cancelled = true; };
  }, [lecture.id, reloadKey]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <AlertTriangle size={16} className="text-destructive" /> 강의를 불러오지 못했어요
        </div>
        <p className="max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">{error}</p>
        <div className="mt-1 flex gap-2">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="h-9 rounded-lg bg-primary px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#9A3412]"
          >
            다시 시도
          </button>
          <button
            onClick={() => navigate("/library")}
            className="h-9 rounded-lg border border-border px-4 text-[12.5px] font-medium text-foreground hover:bg-secondary"
          >
            라이브러리로
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-[13px] text-muted-foreground">
        <Loader2 size={15} className="animate-spin" /> 워크스페이스 여는 중…
      </div>
    );
  }
  return <StudyInner lecture={lecture} data={data} />;
}

function StudyInner({ lecture, data }: { lecture: Lecture; data: StudyData }) {
  const { folders } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const docMode = !lecture.hasAudio;

  /* 검색 등에서 ?t= / ?s= 로 진입 시 해당 위치에서 시작 */
  const initialT = (() => {
    const t = Number(searchParams.get("t"));
    if (!Number.isNaN(t) && t > 0) return t;
    const s = Number(searchParams.get("s"));
    if (!Number.isNaN(s) && s > 0) return data.slides.find((sl) => sl.n === s)?.startSec ?? 0;
    return (data.slides.find((sl) => sl.n === data.defaultSlide)?.startSec ?? 0) + 14; // 데모 기본 슬라이드
  })();

  const pb = usePlayback(data.slides, data.durationSec, initialT);

  /* 챕터: 재생 위치를 따라가고, 수동 선택(문서 모드)은 별도 상태 */
  const [manualChapter, setManualChapter] = useState(0);
  const activeChapter = docMode ? manualChapter : chapterOfSlide(data.chapters, pb.activeSlideN);
  const selectChapter = (idx: number) => {
    const clamped = Math.max(0, Math.min(data.chapters.length - 1, idx));
    if (docMode) { setManualChapter(clamped); return; }
    const firstSlide = data.slides.find((s) => s.n === data.chapters[clamped].slides[0]);
    if (firstSlide) pb.seek(firstSlide.startSec + 0.5);
  };

  const [tab, setTab] = useState<RefTab>("summary");
  const [qaMessages, setQaMessages] = useState<QAMessage[]>([
    { role: "ai", text: '안녕하세요! 이 강의 내용에 대해 무엇이든 물어보세요. 예: "Fiat-Shamir 변환이 왜 안전해?"' },
  ]);
  const [qaPending, setQaPending] = useState(false);
  const [qaDraft, setQaDraft] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [photoFocus, setPhotoFocus] = useState<string | null>(null);

  /* 노트의 판서 언급 클릭 → 사진 탭 + 해당 사진 포커스 */
  const openPhotoTab = (photoId: string) => { setPhotoFocus(photoId); setTab("photos"); };

  const pushToast = (text: string, done = false) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, done }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  const sendQA = async (q: string) => {
    if (!q || qaPending) return;
    setQaDraft("");
    setQaMessages((m) => [...m, { role: "user", text: q }]);
    setQaPending(true);
    try {
      const ans = await ragQA(lecture.id, q, pb.activeSlideN);
      setQaMessages((m) => [...m, ans]);
    } catch (e) {
      // 실서버 qa는 실패 가능(RAG 인덱스 미생성 400·401·네트워크) → 챗에 안내 + pending 해제
      const text = e instanceof Error && e.message
        ? `답변 생성 실패: ${e.message}`
        : "답변 생성 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.";
      setQaMessages((m) => [...m, { role: "ai", text }]);
    } finally {
      setQaPending(false);
    }
  };

  const doExport = async (formatKey: (typeof EXPORT_FORMATS)[number]["key"], label: string) => {
    pushToast(`${label} 내보내기 — 백그라운드 생성 중… (작업 계속 가능)`);
    const filename = await requestExport(lecture.title, formatKey);
    pushToast(`${filename} 다운로드 준비 완료`, true);
  };

  const folderName = useMemo(() => folders.find((f) => f.id === lecture.folderId)?.name, [folders, lecture.folderId]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ===== A. 상단 바 ===== */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-white px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/library")} className="flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-primary">
            <ChevronLeft size={14} /> Library
          </button>
          <span className="text-border">|</span>
          <h1 className="text-[14.5px] font-bold text-card-foreground">{lecture.title}</h1>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{folderName}</span>
          {docMode && <span className="badge-status badge-queued">문서 모드 — 녹음 없음</span>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-lg bg-[#17130F] px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-black">
            <Download size={13} /> 노트 내보내기
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground">이 강의의 노트 — 형광펜·사진 포함</div>
            {EXPORT_FORMATS.map((f) => (
              <DropdownMenuItem key={f.key} onClick={() => doExport(f.key, f.label)}>
                <span className="font-medium">{f.label}</span>
                <span className="ml-auto text-[10.5px] text-muted-foreground">{f.desc}</span>
              </DropdownMenuItem>
            ))}
            <div className="border-t border-border px-2 py-1.5 text-[10px] text-muted-foreground">
              Export는 백그라운드 생성 → 완료 토스트에서 다운로드
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* ===== B·C·D 3-pane (경계를 드래그해 크기 조절) ===== */}
      <PanelGroup direction="horizontal" autoSaveId="lectra-study-panes" className="min-h-0 flex-1">
        <Panel defaultSize={30} minSize={16} className="min-w-0">
          <SlideStrip slides={data.slides} chapters={data.chapters} pb={pb} docMode={docMode} pdfUrl={data.pdfUrl} />
        </Panel>
        <ResizeHandle />
        <Panel defaultSize={42} minSize={28} className="min-w-0">
          <NotePane data={data} pb={pb} docMode={docMode} chapter={data.chapters[activeChapter]} onSelectChapter={selectChapter} onPhotoRef={openPhotoTab} />
        </Panel>
        <ResizeHandle />
        <Panel defaultSize={28} minSize={18} className="min-w-0">
          <RefPanel
            data={data} pb={pb}
            activeChapter={activeChapter} onSelectChapter={selectChapter}
            tab={tab} onTab={setTab}
            qaMessages={qaMessages} qaPending={qaPending}
            qaDraft={qaDraft} onQaDraft={setQaDraft}
            onSendQA={sendQA}
            onPushQA={(m) => setQaMessages((prev) => [...prev, m])}
            focusPhotoId={photoFocus}
          />
        </Panel>
      </PanelGroup>

      {/* ===== E. 정렬 타임라인 / 문서 모드 바 ===== */}
      {docMode ? (
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-[#17130F] px-5 py-2.5">
          <span className="text-[11.5px] text-white/50">
            녹음이 없는 강의 — 정렬 타임라인 비활성. 녹음을 추가하면 정렬·타임라인이 생성됩니다.
          </span>
          <button
            onClick={() => navigate("/library?upload=1")}
            className="flex items-center gap-1.5 rounded-full bg-[var(--ember)] px-3.5 py-1.5 text-[12px] font-semibold text-black hover:brightness-95"
          >
            <Mic size={12} /> + 녹음 추가
          </button>
        </div>
      ) : (
        <Timeline slides={data.slides} photos={data.photos} pb={pb} />
      )}

      {/* ===== 토스트 ===== */}
      <div className="pointer-events-none fixed bottom-24 right-5 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[12.5px] font-medium text-card-foreground shadow-xl">
            {t.done ? <CheckCircle2 size={15} className="text-[#16A34A]" /> : <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            {t.text}
            {t.done && <button className="pointer-events-auto ml-1 font-semibold text-primary hover:underline">다운로드</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
