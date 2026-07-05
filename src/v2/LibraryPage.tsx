/* ================================================================
   LibraryPage — 2단 구조 (Flexcil 스타일)
   /library            → 과목 폴더 그리드 (폴더 모양 카드)
   /library?folder=is  → 해당 과목의 강의(업로드한 슬라이드 단위) 카드
   ================================================================ */
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowUpDown, ChevronLeft, FolderOpen, MoreHorizontal, Plus, RotateCcw, Upload } from "lucide-react";
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
import type { Folder, Lecture } from "./types";
import UploadModal from "./UploadModal";

type SortKey = "updated" | "name" | "uploaded" | "status";
const SORT_LABEL: Record<SortKey, string> = {
  updated: "최근 수정순", name: "이름순", uploaded: "업로드일순", status: "상태순 (처리중 우선)",
};
const STATUS_ORDER: Record<Lecture["status"], number> = { processing: 0, queued: 1, failed: 2, uploading: 0, ready: 3 };

/** 과목 폴더 색상 팔레트 (웜 계열 순환) */
const FOLDER_COLORS = [
  { tab: "#DF7A55", from: "#F9DCCE", to: "#F3C3AC", text: "#8A3D1F" },
  { tab: "#E0A23E", from: "#FBE8C4", to: "#F5D69A", text: "#7C5308" },
  { tab: "#A99677", from: "#EFE7D6", to: "#E3D5BC", text: "#5C4F38" },
  { tab: "#C98A6B", from: "#F5DFD3", to: "#EBC9B5", text: "#7A4429" },
];

function StatusBadge({ lec }: { lec: Lecture }) {
  switch (lec.status) {
    case "ready":      return <span className="badge-status badge-ready">Ready</span>;
    case "processing": return <span className="badge-status badge-processing">Processing {Math.round(lec.progress)}%</span>;
    case "queued":     return <span className="badge-status badge-queued">대기 중{lec.queueOrder ? ` · 큐 ${lec.queueOrder}번째` : ""}</span>;
    case "failed":     return <span className="badge-status badge-failed">Failed · Retry</span>;
    default:           return <span className="badge-status badge-queued">업로드 중</span>;
  }
}

/** Flexcil 스타일 폴더 카드 */
function FolderCard({ folder, lectures, colorIdx, onOpen }: { folder: Folder; lectures: Lecture[]; colorIdx: number; onOpen: () => void }) {
  const c = FOLDER_COLORS[colorIdx % FOLDER_COLORS.length];
  const processing = lectures.filter((l) => l.status === "processing" || l.status === "queued").length;
  const latest = [...lectures].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
  return (
    <button onClick={onOpen} className="group text-left">
      <div className="relative pt-3">
        {/* 폴더 탭 */}
        <div className="absolute left-0 top-0 h-6 w-24 rounded-t-xl" style={{ background: c.tab }} />
        {/* 폴더 본체 */}
        <div
          className="card-lift relative flex aspect-[16/10] flex-col justify-between rounded-2xl rounded-tl-none p-4 shadow-[0_2px_8px_rgba(28,25,23,0.07)]"
          style={{ background: `linear-gradient(145deg, ${c.from} 0%, ${c.to} 100%)` }}
        >
          {/* 안쪽 서류 힌트 */}
          <div className="absolute left-4 right-4 top-3 h-10 rounded-lg bg-white/45" />
          <div className="absolute left-6 right-6 top-1.5 h-10 rounded-lg bg-white/30" />
          <div className="relative" />
          <div className="relative flex items-end justify-between">
            <div>
              <div className="text-[22px] font-bold leading-none" style={{ color: c.text }}>{lectures.length}</div>
              <div className="mt-1 text-[11px] font-medium" style={{ color: c.text, opacity: 0.75 }}>강의</div>
            </div>
            {processing > 0 && (
              <span className="rounded-full bg-white/75 px-2.5 py-1 text-[10.5px] font-semibold" style={{ color: c.text }}>
                {processing}개 처리 중
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <div className="text-[15px] font-bold text-card-foreground transition-colors group-hover:text-primary">{folder.name}</div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">
          강의 {lectures.length}개{latest ? ` · 최근 수정 ${latest.updatedLabel}` : ""}
        </div>
      </div>
    </button>
  );
}

export default function LibraryPage() {
  const { folders, lectures, removeLecture, renameLecture, moveLecture, retryLecture, cancelJob } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get("folder");
  const uploadOpen = searchParams.get("upload") === "1";

  const [sort, setSort] = useState<SortKey>("updated");
  const [deleting, setDeleting] = useState<Lecture | null>(null);
  const [renaming, setRenaming] = useState<Lecture | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const folder = folders.find((f) => f.id === folderId) ?? null;

  const shown = useMemo(() => {
    if (!folder) return [];
    const list = lectures.filter((l) => l.folderId === folder.id);
    return [...list].sort((a, b) => {
      switch (sort) {
        case "name":     return a.title.localeCompare(b.title);
        case "uploaded": return b.uploadedAt.localeCompare(a.uploadedAt);
        case "status":   return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        default:         return b.uploadedAt.localeCompare(a.uploadedAt);
      }
    });
  }, [lectures, folder, sort]);

  const closeUpload = () => { searchParams.delete("upload"); setSearchParams(searchParams, { replace: true }); };
  const openUpload = () => { searchParams.set("upload", "1"); setSearchParams(searchParams); };

  /* ===================== 과목 폴더 그리드 ===================== */
  if (!folder) {
    return (
      <div className="mx-auto max-w-[1400px] px-8 py-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-card-foreground">전체 강의</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">과목 {folders.length}개 · 강의 {lectures.length}개</p>
          </div>
          <button
            onClick={openUpload}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(194,65,12,0.22)] transition-colors hover:bg-[#9A3412]"
          >
            <Upload size={14} /> Upload
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {folders.map((f, i) => (
            <FolderCard
              key={f.id}
              folder={f}
              colorIdx={i}
              lectures={lectures.filter((l) => l.folderId === f.id)}
              onOpen={() => { searchParams.set("folder", f.id); setSearchParams(searchParams); }}
            />
          ))}
        </div>

        <p className="mt-12 text-center text-[11.5px] text-muted-foreground/70">
          과목 폴더를 열면 업로드한 슬라이드(단원) 단위로 강의가 보입니다.
        </p>
        {uploadOpen && <UploadModal defaultFolderId={null} onClose={closeUpload} />}
      </div>
    );
  }

  /* ===================== 폴더 내 강의 카드 ===================== */
  return (
    <div className="mx-auto max-w-[1400px] px-8 py-7">
      <button
        onClick={() => { searchParams.delete("folder"); setSearchParams(searchParams); }}
        className="flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronLeft size={14} /> 전체 과목
      </button>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-card-foreground">{folder.name}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            강의 {shown.length}개{shown[0] ? ` · 최근 수정 ${shown[0].updatedLabel}` : ""}
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
            onClick={openUpload}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(194,65,12,0.22)] transition-colors hover:bg-[#9A3412]"
          >
            <Upload size={14} /> Upload
          </button>
        </div>
      </div>

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
            onClick={openUpload}
            className="mt-6 flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-[13.5px] font-semibold text-white hover:bg-[#9A3412]"
          >
            <Plus size={15} /> Upload your first lecture
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((lec) => (
            <div
              key={lec.id}
              onClick={() => navigate(`/lecture/${lec.id}`)}
              className="card-lift group cursor-pointer overflow-hidden rounded-xl border border-border bg-card"
            >
              {/* 썸네일: 해당 강의 첫 슬라이드 렌더 (없으면 플레이스홀더) */}
              <div className="relative h-36 overflow-hidden border-b border-border bg-gradient-to-br from-[#FBF7F1] to-[#F3EDE4]">
                {(lec.id.startsWith("bt") || lec.id.startsWith("cn") || ["w10", "is05", "cnref"].includes(lec.id)) && (
                  <img
                    src={`/slides/${lec.id.startsWith("bt") ? "bt" : lec.id.startsWith("cn") ? "cn" : "zk"}/p1.png`}
                    alt="" className="h-full w-full object-cover object-top opacity-90" loading="lazy"
                  />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-card-foreground">{lec.title}</h3>
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
                  {folder.name} · {lec.updatedLabel}{lec.slideCount ? ` · 슬라이드 ${lec.slideCount}장` : ""}
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

      {/* 삭제 확인 */}
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

      {/* 이름 변경 */}
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

      {uploadOpen && <UploadModal defaultFolderId={folder.id} onClose={closeUpload} />}
    </div>
  );
}
