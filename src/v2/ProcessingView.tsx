/* ================================================================
   ProcessingView — 와이어프레임 4.0~4.2
   6단계 파이프라인 (정렬 = core step ★) 세로 스테퍼 + 압축 가로 스테퍼
   실패: FAILED 배지 + 에러코드 + Retry step / Replace file / Contact support
   하단: 내 처리 현황 — 전체 강의 (동시 처리 + 대기 큐)
   ================================================================ */
import { useNavigate } from "react-router";
import { AlertTriangle, Check, ChevronLeft, Loader2, RefreshCcw, Upload, X } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "../app/components/ui/alert-dialog";
import { useApp } from "./store";
import { PIPELINE_STEPS, type Lecture } from "./types";

export default function ProcessingView({ lecture }: { lecture: Lecture }) {
  const { lectures, retryLecture, cancelJob } = useApp();
  const navigate = useNavigate();

  const failed = lecture.status === "failed";
  const queued = lecture.status === "queued";
  const activeStep = failed ? lecture.failedStep! : lecture.stepIndex;
  const current = PIPELINE_STEPS[Math.min(activeStep, 5)];

  const others = lectures.filter((l) => l.id !== lecture.id && (l.status === "processing" || l.status === "queued"));

  const stepState = (i: number): "done" | "active" | "failed" | "pending" => {
    if (failed) return i < lecture.failedStep! ? "done" : i === lecture.failedStep! ? "failed" : "pending";
    if (queued) return "pending";
    return i < activeStep ? "done" : i === activeStep ? "active" : "pending";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ===== 헤더 ===== */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/library")} className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-primary">
            <ChevronLeft size={15} /> Library
          </button>
          <span className="text-border">|</span>
          <h1 className="text-[15px] font-bold text-card-foreground">{lecture.title}</h1>
          <span className={`badge-status ${failed ? "badge-failed" : queued ? "badge-queued" : "badge-processing"}`}>
            {failed ? "Failed" : queued ? `대기 중 · 큐 ${lecture.queueOrder ?? 1}번째` : "Processing"}
          </span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive">
            <X size={13} /> Cancel job
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>처리를 취소할까요?</AlertDialogTitle>
              <AlertDialogDescription>업로드된 파일과 진행 중인 분석이 삭제됩니다. 되돌릴 수 없습니다.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>계속 처리</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-white hover:bg-red-700" onClick={() => { cancelJob(lecture.id); navigate("/library"); }}>
                취소하고 삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <div className="mx-auto max-w-3xl px-8 py-10">
        {/* 실패 배너 */}
        {failed && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-destructive" />
            <div>
              <div className="text-[14px] font-semibold text-destructive">처리 실패 — {lecture.failedStep! + 1}단계에서 중단</div>
              <div className="mt-0.5 text-[12.5px] text-red-700/80">
                error: {lecture.errorCode} {lecture.errorCode === "STT_TIMEOUT" && "— 오디오 비트레이트 확인"} · 라이브러리 카드에도 Failed 배지가 표시됩니다
              </div>
            </div>
          </div>
        )}

        <h1 className="text-[24px] font-bold tracking-tight text-card-foreground">Preparing your workspace</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          처리가 끝나면 이 페이지가 자동으로 스터디 워크스페이스로 전환됩니다.
        </p>

        {/* ===== 압축 가로 스테퍼 ===== */}
        <div className="mt-8 flex items-center">
          {PIPELINE_STEPS.map((s, i) => {
            const st = stepState(i);
            return (
              <div key={s.key} className="flex flex-1 items-center" title={`${s.label} — ${s.sub}`}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    st === "done" ? "bg-[var(--ember)] text-white"
                    : st === "active" ? "bg-primary text-white shadow-[0_0_0_5px_rgba(194,65,12,0.15)]"
                    : st === "failed" ? "bg-destructive text-white"
                    : "bg-secondary text-muted-foreground"
                  }`}>
                    {st === "done" ? <Check size={13} strokeWidth={3} /> : st === "active" ? <Loader2 size={13} className="animate-spin" /> : st === "failed" ? <X size={13} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`whitespace-nowrap text-[10.5px] font-medium ${st === "active" ? "text-primary" : st === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                    {s.labelKo}
                  </span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className={`mx-1.5 mb-5 h-0.5 flex-1 rounded ${stepState(i + 1) !== "pending" || st === "done" ? "bg-[var(--ember)]" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ===== 세로 상세 스테퍼 ===== */}
        <div className="mt-8 space-y-1">
          {PIPELINE_STEPS.map((s, i) => {
            const st = stepState(i);
            const isAlign = s.key === "align";
            return (
              <div key={s.key} title="호버하면 상세 로그 · 소요 시간 (실연동 시)"
                className={`flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-colors ${
                  st === "active" ? "border-primary/30 bg-accent"
                  : st === "failed" ? "border-red-200 bg-red-50"
                  : "border-border bg-card"
                }`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  st === "done" ? "bg-[var(--st-ready-bg)] text-[#16A34A]"
                  : st === "active" ? "bg-primary text-white"
                  : st === "failed" ? "bg-destructive text-white"
                  : "bg-secondary text-muted-foreground"
                }`}>
                  {st === "done" ? <Check size={14} strokeWidth={3} /> : st === "active" ? <Loader2 size={14} className="animate-spin" /> : st === "failed" ? <X size={14} strokeWidth={3} /> : <span className="text-[12px] font-bold">{i + 1}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13.5px] font-semibold text-card-foreground">
                    {s.label}
                    {isAlign && <span className="rounded-full bg-[var(--ember-soft)] px-2 py-0.5 text-[10px] font-bold text-[#92400E]">core step ★</span>}
                    {st === "failed" && <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-white">FAILED</span>}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">{s.sub}</div>
                </div>
                <div className="shrink-0 text-[12px] font-medium tabular-nums text-muted-foreground">
                  {st === "done" ? "done" : st === "active" ? `${Math.round(lecture.progress)}%` : ""}
                </div>
              </div>
            );
          })}
        </div>

        {/* 실패 복구 액션 */}
        {failed && (
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button onClick={() => retryLecture(lecture.id)} className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:bg-[#9A3412]">
              <RefreshCcw size={13} /> Retry step
            </button>
            <button className="flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-4 text-[13px] font-medium hover:bg-secondary">
              <Upload size={13} /> Replace file
            </button>
            <a href="mailto:focustationcapstone@gmail.com" className="flex h-10 items-center rounded-lg border border-border bg-card px-4 text-[13px] font-medium hover:bg-secondary">
              Contact support
            </a>
          </div>
        )}

        {/* 전체 진행 */}
        {!failed && (
          <div className="mt-7">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-primary transition-all duration-700" style={{ width: `${lecture.progress}%` }} />
            </div>
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              {queued
                ? `대기 중 — 앞선 작업이 끝나면 자동으로 시작됩니다 (큐 ${lecture.queueOrder ?? 1}번째)`
                : <>현재 {activeStep + 1}/6 · {current.label} — {Math.round(lecture.progress)}%{lecture.etaMin ? ` · ETA 약 ${lecture.etaMin}분` : ""} · <span className="text-muted-foreground/80">페이지를 떠나도 계속 진행됩니다</span></>}
            </p>
          </div>
        )}

        {/* ===== 내 처리 현황 — 전체 강의 ===== */}
        {others.length > 0 && (
          <div className="mt-10">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-bold text-card-foreground">내 처리 현황 — 전체 강의</h2>
              <span className="text-[11.5px] text-muted-foreground">동시 처리 상태 한눈에</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {others.map((l) => (
                <button key={l.id} onClick={() => navigate(`/lecture/${l.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-primary/40">
                  <span className="text-[13px] font-medium text-card-foreground">{l.title}</span>
                  <span className="text-[12px] tabular-nums text-muted-foreground">
                    {l.status === "queued"
                      ? `대기 중 (큐 ${l.queueOrder}번째)`
                      : `${l.stepIndex + 1}/6 ${PIPELINE_STEPS[l.stepIndex].labelKo} ${Math.round(l.progress)}%`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
