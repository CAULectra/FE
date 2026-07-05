/* ================================================================
   LibraryPage — 폴더별 강의 카드 그리드 (와이어프레임 2.0~2.3)
   카드 = 썸네일 + 제목 + 폴더·날짜 + 처리 상태 배지
   헤더 = 폴더명 · 개수 · 정렬 드롭다운 · + Upload
   상태: 빈 상태 / 컨텍스트 메뉴 / 이름 변경 / 이동 / 삭제 확인
   ================================================================ */
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { ArrowUpDown, FolderOpen, MoreHorizontal, Plus, RotateCcw, Upload } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "../app/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../app/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../app/components/ui/dialog";
import { useApp } from "./store";
import type { Lecture } from "./types";
import UploadModal from "./UploadModal";

type SortKey = "updated" | "name" | "uploaded" | "status";
const SORT_LABEL: Record<SortKey, string> = {
  updated: "최근 수정순", name: "이름순", uploaded: "업로드일순", status: "상태순 (처리중 우선)",
};
const STATUS_ORDER: Record<Lecture["status"], number> = { processing: 0, queued: 1, failed: 2, uploading: 0, ready: 3 };

function StatusBadge({ lec }: { lec: Lecture }) {
  switch (lec.status) {
    case "ready":      return <span className="badge-status badge-ready">Ready</span>;
    case "processing": return <span className="badge-status badge-processing">Processing {Math.round(lec.progress)}%</span>;
    case "queued":     return <span className="badge-status badge-queued">대기 중{lec.queueOrder ? ` · 큐 ${lec.queueOrder}번째` : ""}</span>;
    case "failed":     return <span className="badge-status badge-failed">Failed · Retry</span>;
    default:           return <span className="badge-status badge-queued">업로드 중</span>;
  }
}

/** 슬라이드 썸네일 플레이스홀더 (실연동 시 첫 페이지 렌더 이미지로 교체) */
function Thumb({ seed }: { seed: string }) {
  const hue = (seed.charCodeAt(0) * 7) % 24;
  return (
    <div className="relative h-36 overflow-hidden rounded-t-xl border-b border-border bg-gradient-to-br from-[#FBF7F1] to-[#F3EDE4]">
      <div className="absolute left-5 top-5 h-2.5 w-2/5 rounded bg-[#E3DACB]" style={{ filter: `hue-rotate(${hue}deg)` }} />
      <div className="absolute left-5 top-11 h-1.5 w-3/5 rounded bg-[#EDE6DA]" />
      <div className="absolute left-5 top-[58px] h-1.5 w-1/2 rounded bg-[#EDE6DA]" />
      <div className="absolute bottom-4 left-5 right-5 top-[76px] rounded-md border border-[#EBE3D6] bg-white/70" />
    </div>
  );
}

export default function LibraryPage() {
  const { folders, lectures, removeLecture, renameLecture, moveLecture, retryLecture, cancelJob } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get("folder");
  const uploadOpen = searchParams.get("upload") === "1";

  const [sort, setSort] = useState<SortKey>("updated");
  const [deleting, setDeleting] = useState<Lecture | null>(null);
  const [renaming, setRenaming] = useState<Lecture | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const folder = folders.find((f) => f.id === folderId) ?? null;

  const shown = useMemo(() => {
    const list = lectures.filter((l) => !folder || l.folderId === folder.id);
    return [...list].sort((a, b) => {
      switch (sort) {
        case "name":     return a.title.localeCompare(b.title);
        case "uploaded": return b.uploadedAt.localeCompare(a.uploadedAt);
        case "status":   return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        default:         return b.uploadedAt.localeCompare(a.uploadedAt);
      }
    });
  }, [lectures, folder, sort]);

  const latestLabel = shown[0]?.updatedLabel;
  const closeUpload = () => { searchParams.delete("upload"); setSearchParams(searchParams, { replace: true }); };

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-7">
      {/* ===== 헤더 ===== */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-card-foreground">{folder ? folder.name : "전체 강의"}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            강의 {shown.length}개{latestLabel ? ` · 최근 수정 ${latestLabel}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary">
              <ArrowUpDown size={13} /> {SORT_LABEL[sort]}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <DropdownMenuItem key={k} onClick={() => setSort(k)}>
                  <span className={sort === k ? "font-semibold text-primary" : ""}>{sort === k ? "✓ " : ""}{SORT_LABEL[k]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => { searchParams.set("upload", "1"); setSearchParams(searchParams); }}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(194,65,12,0.22)] transition-colors hover:bg-[#9A3412]"
          >
            <Upload size={14} /> Upload
          </button>
        </div>
      </div>

      {/* ===== 카드 그리드 / 빈 상태 ===== */}
      {shown.length === 0 ? (
        <div className="mt-24 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <FolderOpen size={26} className="text-muted-foreground" />
          </div>
          <h2 className="mt-5 text-[19px] font-bold text-card-foreground">아직 강의가 없어요</h2>
          <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
            슬라이드 PDF + 녹음 파일(+ 사진)을 올리면 정렬된 노트가 자동으로 만들어져요
          </p>
          <button
            onClick={() => { searchParams.set("upload", "1"); setSearchParams(searchParams); }}
            className="mt-6 flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-[13.5px] font-semibold text-white hover:bg-[#9A3412]"
          >
            <Plus size={15} /> Upload your first lecture
          </button>
          <button onClick={() => navigate("/lecture/w10")} className="mt-3 text-[12.5px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline">
            또는 샘플 워크스페이스 둘러보기
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((lec) => (
            <div
              key={lec.id}
              onClick={() => navigate(`/lecture/${lec.id}`)}
              className="card-lift group cursor-pointer rounded-xl border border-border bg-card"
            >
              <Thumb seed={lec.id} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-card-foreground">{lec.title}</h3>
                  {/* 카드 hover 시 ⋯ 컨텍스트 메뉴 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100 data-[state=open]:opacity-100"
                    >
                      <MoreHorizontal size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => navigate(`/lecture/${lec.id}`)}>열기</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setRenaming(lec); setRenameValue(lec.title); }}>이름 변경</DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>다른 폴더로 이동</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {folders.filter((f) => f.id !== lec.folderId).map((f) => (
                            <DropdownMenuItem key={f.id} onClick={() => moveLecture(lec.id, f.id)}>{f.name}</DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem onClick={() => retryLecture(lec.id)} disabled={lec.status !== "failed"}>
                        <RotateCcw size={13} className="mr-1" /> 다시 처리 (re-run)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleting(lec)}>삭제</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {folders.find((f) => f.id === lec.folderId)?.name} · {lec.updatedLabel}
                </p>
                <div className="mt-3"><StatusBadge lec={lec} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-[11.5px] text-muted-foreground/70">
        카드를 클릭하면 강의 페이지가 열립니다 — 처리 중엔 진행 상황을, 완료되면 스터디 워크스페이스를 보여줍니다.
      </p>

      {/* ===== 삭제 확인 ===== */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>강의를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              휴지통으로 이동 후 30일 뒤 영구 삭제됩니다.
              {deleting && (deleting.status === "processing" || deleting.status === "queued") && (
                <><br />처리 중인 강의는 job 취소 후 삭제됩니다.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-red-700"
              onClick={() => { if (deleting) { deleting.status === "ready" || deleting.status === "failed" ? removeLecture(deleting.id) : cancelJob(deleting.id); } setDeleting(null); }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== 이름 변경 ===== */}
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>이름 변경</DialogTitle></DialogHeader>
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && renaming && renameValue.trim()) { renameLecture(renaming.id, renameValue.trim()); setRenaming(null); } }}
            className="h-10 w-full rounded-lg border border-border bg-[var(--input-background)] px-3 text-[14px] focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(194,65,12,0.12)]"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setRenaming(null)} className="h-9 rounded-lg border border-border px-4 text-[13px] font-medium hover:bg-secondary">취소</button>
            <button
              disabled={!renameValue.trim()}
              onClick={() => { if (renaming && renameValue.trim()) { renameLecture(renaming.id, renameValue.trim()); setRenaming(null); } }}
              className="h-9 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:bg-[#9A3412] disabled:opacity-40"
            >
              저장
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== 업로드 모달 (?upload=1) ===== */}
      {uploadOpen && <UploadModal defaultFolderId={folder?.id ?? null} onClose={closeUpload} />}
    </div>
  );
}
