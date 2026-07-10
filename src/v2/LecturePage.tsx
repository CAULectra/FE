/* ================================================================
   LecturePage — 강의 단일 페이지 (/lecture/:id)
   ready면 StudyWorkspace, 아직 준비 전(처리/대기/실패)이면 라이브러리로 보낸다.
   처리 상세 페이지(파이프라인 단계)는 사용자에게 노출하지 않음 —
   진행 현황은 워크스페이스에서 진행바로만 확인.
   ================================================================ */
import { Navigate, useParams } from "react-router";
import { useApp } from "./store";
import StudyWorkspace from "./study/StudyWorkspace";

export default function LecturePage() {
  const { id } = useParams<{ id: string }>();
  const { lectures } = useApp();
  const lecture = lectures.find((l) => l.id === id);

  if (!lecture || lecture.status !== "ready") return <Navigate to="/library" replace />;
  return <StudyWorkspace lecture={lecture} />;
}
