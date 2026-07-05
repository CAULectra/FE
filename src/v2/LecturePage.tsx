/* ================================================================
   LecturePage — 강의 단일 페이지 (와이어프레임 S1 핵심 규칙)
   같은 URL(/lecture/:id)이 상태에 따라 모습을 바꾼다:
   processing/queued/failed → ProcessingView
   ready                    → StudyWorkspace
   처리 완료 순간을 목격하면 3초 카운트다운 후 자동 전환 ([지금 열기] 가능)
   ================================================================ */
import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { useApp } from "./store";
import ProcessingView from "./ProcessingView";
import StudyWorkspace from "./study/StudyWorkspace";

export default function LecturePage() {
  const { id } = useParams<{ id: string }>();
  const { lectures } = useApp();
  const navigate = useNavigate();
  const lecture = lectures.find((l) => l.id === id);

  const prevStatus = useRef(lecture?.status);
  const [justFinished, setJustFinished] = useState(false);
  const [countdown, setCountdown] = useState(3);

  /* 처리 중 → ready 전환 목격 시 3초 자동 전환 배너 */
  useEffect(() => {
    if (!lecture) return;
    if (prevStatus.current !== "ready" && lecture.status === "ready" && prevStatus.current !== undefined) {
      setJustFinished(true);
      setCountdown(3);
    }
    prevStatus.current = lecture.status;
  }, [lecture?.status, lecture]);

  useEffect(() => {
    if (!justFinished) return;
    if (countdown <= 0) { setJustFinished(false); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [justFinished, countdown]);

  if (!lecture) return <Navigate to="/library" replace />;

  if (lecture.status === "ready" && !justFinished) {
    return <StudyWorkspace lecture={lecture} />;
  }

  if (lecture.status === "ready" && justFinished) {
    return (
      <div className="flex h-full min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--st-ready-bg)]">
          <CheckCircle2 size={30} className="text-[#16A34A]" />
        </div>
        <h1 className="mt-5 text-[24px] font-bold text-card-foreground">처리 완료!</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">모든 단계가 끝났어요 — 워크스페이스로 이동합니다</p>
        <div className="mt-6 flex items-center gap-3">
          <span className="text-[13px] tabular-nums text-muted-foreground">{countdown}초 후 자동 전환</span>
          <button
            onClick={() => setJustFinished(false)}
            className="h-10 rounded-lg bg-primary px-5 text-[13.5px] font-semibold text-white hover:bg-[#9A3412]"
          >
            지금 열기
          </button>
        </div>
        <button onClick={() => navigate("/library")} className="mt-4 text-[12.5px] text-muted-foreground hover:text-primary">← 라이브러리로</button>
      </div>
    );
  }

  return <ProcessingView lecture={lecture} />;
}
