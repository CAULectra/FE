/* ================================================================
   LibraryPage — 2단 구조 (Flexcil 스타일)
   /library            → 과목 폴더 그리드 (폴더 모양 카드)
   /library?folder=is  → 해당 과목의 강의(업로드한 슬라이드 단위) 카드
   ================================================================ */
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowUpDown, ChevronLeft, FileText, FolderOpen, FolderPlus, MoreHorizontal, Plus, RotateCcw, Sparkles, Star, Upload } from "lucide-react";
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
import { deriveFolders } from "./adapters";
import UploadModal from "./UploadModal";
import FolderIcon from "./FolderIcon";

type SortKey = "updated" | "name" | "uploaded" | "status";
const SORT_LABEL: Record<SortKey, string> = {
  updated: "최근 수정순", name: "이름순", uploaded: "업로드일순", status: "상태순 (처리중 우선)",
};
const STATUS_ORDER: Record<Lecture["status"], number> = { processing: 0, uploaded: 0, queued: 1, failed: 2, uploading: 0, ready: 3 };

/** 과목 폴더 아이콘 색상 (노랑 · 올리브 · 하늘 순환) */
const FOLDER_ICON_COLORS = ["#EAB308", "#94A13C", "#7DD3FC"];

function StatusBadge({ lec }: { lec: Lecture }) {
  switch (lec.status) {
    case "ready":      return <span className="badge-status badge-ready">Ready</span>;
    case "processing": return <span className="badge-status badge-processing">Processing {Math.round(lec.progress)}%</span>;
    case "queued":     return <span className="badge-status badge-queued">대기 중{lec.queueOrder ? ` · 큐 ${lec.queueOrder}번째` : ""}</span>;
    case "failed":     return <span className="badge-status badge-failed">Failed · Retry</span>;
    case "uploaded":   return <span className="badge-status badge-queued">처리 전</span>;
    default:           return <span className="badge-status badge-queued">업로드 중</span>;
  }
}

/** 과목 폴더 아이콘 카드 (노랑·올리브·하늘) */
function FolderCard({ folder, lectures, colorIdx, onOpen }: { folder: Folder; lectures: Lecture[]; colorIdx: number; onOpen: () => void }) {
  const color = FOLDER_ICON_COLORS[colorIdx % FOLDER_ICON_COLORS.length];
  const latest = [...lectures].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="group/card flex cursor-pointer flex-col items-center rounded-2xl px-4 py-6 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex h-[132px] items-end justify-center">
        <FolderIcon color={color} size={1.5} />
      </div>
      <div className="mt-6">
        <div className="text-[15px] font-bold text-card-foreground transition-colors group-hover/card:text-primary">{folder.name}</div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">
          강의 {lectures.length}개{latest ? ` · 최근 수정 ${latest.updatedLabel}` : ""}
        </div>
      </div>
    </div>
  );
}

/** "새로 만들기" 선택 메뉴 — 자료 업로드(프로젝트) vs 폴더 생성.
 *  최상위 컴포넌트로 두어 부모 리렌더(폴링·트리클)에도 열린 메뉴가 유지되게 한다. */
function CreateMenu({ onProject, onFolder, children }: { onProject: () => void; onFolder: () => void; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-60 rounded-xl p-1.5">
        <div className="px-2 pb-1.5 pt-1">
          <div className="text-[13px] font-bold text-card-foreground">새로 만들기</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">프로젝트 · 폴더</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onProject} className="gap-2.5 rounded-lg px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText size={16} /></span>
          <span className="flex flex-col">
            <span className="text-[13px] font-semibold text-card-foreground">새 프로젝트</span>
            <span className="text-[11px] text-muted-foreground">PDF·녹음·판서 업로드</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onFolder} className="gap-2.5 rounded-lg px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAB308]/15 text-[#B78908]"><FolderPlus size={16} /></span>
          <span className="flex flex-col">
            <span className="text-[13px] font-semibold text-card-foreground">새 폴더</span>
            <span className="text-[11px] text-muted-foreground">노트를 정리할 폴더</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function LibraryPage() {
  const { folders, lectures, authed, user, favorites, toggleFavorite, removeLecture, renameLecture, moveLecture, retryLecture, cancelJob, startProcessing, addFolder } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get("folder");
  const uploadOpen = searchParams.get("upload") === "1";

  const [sort, setSort] = useState<SortKey>("updated");
  const [deleting, setDeleting] = useState<Lecture | null>(null);
  const [renaming, setRenaming] = useState<Lecture | null>(null);
  const [renameValue, setRenameValue] = useState("");
  /* 새 폴더 생성 다이얼로그 */
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderErr, setFolderErr] = useState<string | null>(null);
  const [folderBusy, setFolderBusy] = useState(false);

  /* 게스트(!authed)는 라이브러리가 비어 보인다 — '시작하기'로 들어온 빈 화면 */
  const visFolders = authed ? folders : [];
  const visLectures = authed ? lectures : [];
  /* 그리드/폴더 조회는 강의가 실제 참조하는 폴더까지 합쳐 orphan(빈 화면, 이슈 #10) 방지 */
  const allFolders = useMemo(() => deriveFolders(visLectures, visFolders), [visLectures, visFolders]);
  const folder = allFolders.find((f) => f.id === folderId) ?? null;

  const shown = useMemo(() => {
    if (!folder) return [];
    const list = visLectures.filter((l) => l.folderId === folder.id);
    return [...list].sort((a, b) => {
      switch (sort) {
        case "name":     return a.title.localeCompare(b.title);
        case "uploaded": return b.uploadedAt.localeCompare(a.uploadedAt);
        case "status":   return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        default:         return b.uploadedAt.localeCompare(a.uploadedAt);
      }
    });
  }, [visLectures, folder, sort]);

  const closeUpload = () => { searchParams.delete("upload"); setSearchParams(searchParams, { replace: true }); };
  /* 업로드는 인증 필요 — 게스트면 로그인/회원가입 창(?auth=1) 먼저 */
  const blocked = user?.plan === "blocked"; // #34: 베타 접근 차단 유저
  const betaBanner = blocked ? (
    <div className="mb-5 rounded-xl border border-[#F5D9B0] bg-[#FEF6EA] px-5 py-4">
      <div className="text-[14px] font-bold text-[#92400E]">정식 출시 준비 중이에요 — 곧 만나요! 🚀</div>
      <div className="mt-1 text-[12.5px] text-[#B45309]">지금은 베타 참여자만 업로드할 수 있어요. 곧 모두에게 열립니다.</div>
    </div>
  ) : null;
  const openUpload = () => {
    if (!authed) { searchParams.set("auth", "1"); setSearchParams(searchParams); return; }
    if (blocked) return; // 차단 유저는 업로드 불가 — 배너로 안내
    searchParams.set("upload", "1"); setSearchParams(searchParams);
  };
  /* 새 폴더 만들기 — 업로드와 동일 게이트(로그인·베타) */
  const openFolderCreate = () => {
    if (!authed) { searchParams.set("auth", "1"); setSearchParams(searchParams); return; }
    if (blocked) return;
    setNewFolderName(""); setFolderErr(null); setCreatingFolder(true);
  };
  const submitFolder = async () => {
    const name = newFolderName.trim();
    if (!name || folderBusy) return;
    setFolderBusy(true); setFolderErr(null);
    const id = await addFolder(name);
    setFolderBusy(false);
    if (!id) { setFolderErr("폴더를 만들지 못했어요. 잠시 후 다시 시도해주세요."); return; }
    setCreatingFolder(false); setNewFolderName("");
    // 생성 후 폴더 안으로 들어가지 않고 전체 과목 그리드로 → 새 폴더 카드가 보이게
    searchParams.delete("folder"); searchParams.delete("upload"); setSearchParams(searchParams);
  };

  /* 새 폴더 다이얼로그 — 그리드/폴더 두 화면에서 공용으로 렌더 */
  const folderDialog = (
    <Dialog open={creatingFolder} onOpenChange={(o) => { if (!o) { setCreatingFolder(false); setNewFolderName(""); setFolderErr(null); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>새 폴더</DialogTitle></DialogHeader>
        <p className="-mt-1 text-[12.5px] text-muted-foreground">노트를 정리할 폴더를 만들어요. 만든 뒤 그 폴더에 자료를 올릴 수 있어요.</p>
        <input
          autoFocus
          value={newFolderName}
          onChange={(e) => { setNewFolderName(e.target.value); setFolderErr(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") void submitFolder(); }}
          placeholder="예: 확률및통계"
          className="h-10 w-full rounded-lg border border-border bg-[var(--input-background)] px-3 text-[14px] focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(194,65,12,0.12)]"
        />
        {folderErr && <p className="text-[12px] font-medium text-destructive">{folderErr}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setCreatingFolder(false)} className="h-9 rounded-lg border border-border px-4 text-[13px] font-medium hover:bg-secondary">취소</button>
          <button
            disabled={!newFolderName.trim() || folderBusy}
            onClick={() => void submitFolder()}
            className="h-9 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:bg-[#9A3412] disabled:opacity-40"
          >
            {folderBusy ? "만드는 중…" : "만들기"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );

  /* ===================== 과목 폴더 그리드 ===================== */
  if (!folder) {
    return (
      <div className="mx-auto max-w-[1400px] px-8 py-7">
        {betaBanner}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-card-foreground">전체 강의</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">과목 {allFolders.length}개 · 강의 {visLectures.length}개</p>
          </div>
          <CreateMenu onProject={openUpload} onFolder={openFolderCreate}>
            <button
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(194,65,12,0.22)] transition-colors hover:bg-[#9A3412]"
            >
              <Upload size={14} /> 새로 만들기
            </button>
          </CreateMenu>
        </div>

        {allFolders.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <FolderOpen size={26} className="text-muted-foreground" />
            </div>
            <h2 className="mt-5 text-[19px] font-bold text-card-foreground">아직 올린 자료가 없어요</h2>
            <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground whitespace-pre-line">
              슬라이드 PDF와 녹음 파일(+ 사진)을 올리면
               정렬된 노트가 자동으로 만들어져요.
            </p>
            <CreateMenu onProject={openUpload} onFolder={openFolderCreate}>
              <button className="mt-6 flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-[13.5px] font-semibold text-white hover:bg-[#9A3412]">
                <Plus size={15} /> 새로 만들기
              </button>
            </CreateMenu>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {allFolders.map((f, i) => (
                <FolderCard
                  key={f.id}
                  folder={f}
                  colorIdx={i}
                  lectures={visLectures.filter((l) => l.folderId === f.id)}
                  onOpen={() => { searchParams.set("folder", f.id); setSearchParams(searchParams); }}
                />
              ))}
            </div>
            <p className="mt-12 text-center text-[11.5px] text-muted-foreground/70">
              과목 폴더를 열면 업로드한 슬라이드(단원) 단위로 강의가 보입니다.
            </p>
          </>
        )}
        {uploadOpen && <UploadModal defaultFolderId={null} onClose={closeUpload} />}
        {folderDialog}
      </div>
    );
  }

  /* ===================== 폴더 내 강의 카드 ===================== */
  return (
    <div className="mx-auto max-w-[1400px] px-8 py-7">
      {betaBanner}
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
            <Upload size={14} /> 새 프로젝트
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
            <Plus size={15} /> 새 프로젝트
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((lec) => (
            <div
              key={lec.id}
              onClick={() => { if (lec.status === "ready") navigate(`/lecture/${lec.id}`); }}
              className={`card-lift group overflow-hidden rounded-xl border border-border bg-card ${lec.status === "ready" ? "cursor-pointer" : "cursor-default"}`}
            >
              {/* 썸네일: 해당 강의 첫 슬라이드 렌더 (없으면 플레이스홀더) */}
              <div className="relative h-36 overflow-hidden border-b border-border bg-gradient-to-br from-[#FBF7F1] to-[#F3EDE4]">
                {(lec.id.startsWith("bt") || lec.id.startsWith("cn") || ["w10", "is05", "cnref"].includes(lec.id)) && (
                  <img
                    src={`/slides/${lec.id.startsWith("bt") ? "bt" : lec.id.startsWith("cn") ? "cn" : "zk"}/p1.png`}
                    alt="" className="h-full w-full object-cover object-top opacity-90" loading="lazy"
                  />
                )}
                {favorites.includes(lec.id) && (
                  <span className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-[var(--ember)] shadow-sm">
                    <Star size={13} fill="currentColor" />
                  </span>
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
                      <DropdownMenuItem onClick={() => navigate(`/lecture/${lec.id}`)} disabled={lec.status !== "ready"}>열기</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFavorite(lec.id)}>
                        <Star size={13} className="mr-1" fill={favorites.includes(lec.id) ? "currentColor" : "none"} />
                        {favorites.includes(lec.id) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                      </DropdownMenuItem>
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
                {(lec.status === "processing" || lec.status === "queued" || lec.status === "uploading") && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary" title={`${Math.round(lec.progress)}% 분석 중`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-primary transition-all duration-700"
                      style={{ width: `${lec.status === "queued" ? 4 : Math.max(4, lec.progress)}%` }}
                    />
                  </div>
                )}
                {lec.status === "uploaded" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); startProcessing(lec.id); }}
                    className="mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-[12.5px] font-semibold text-white transition-colors hover:bg-[#9A3412]"
                  >
                    <Sparkles size={13} /> 분석 시작
                  </button>
                )}
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
              삭제하면 목록에서 사라지고 휴지통으로 이동합니다. 14일 후 완전 삭제돼요.
              {deleting && (deleting.status === "processing" || deleting.status === "queued") && (
                <><br />처리 중인 강의는 job 취소 후 삭제됩니다.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-red-700"
              onClick={() => {
                if (deleting) {
                  if (deleting.status === "ready" || deleting.status === "failed") removeLecture(deleting.id);
                  else cancelJob(deleting.id);
                }
                setDeleting(null);
              }}
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
      {folderDialog}
    </div>
  );
}
