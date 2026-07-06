/* ================================================================
   AppShell — 다크 프로스트 글래스 사이드바 (Command Center 시그니처)
   구조화된 섹션: 메뉴 / 최근 / 과목(폴더 트리)
   모든 행 = 아이콘+라벨, hover·선택 시 얇은 박스(보더)로 표시
   ================================================================ */
import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import {
  ChevronDown, ChevronRight, FileText, Folder as FolderIcon,
  LayoutGrid, Plus, Search, Settings, X,
} from "lucide-react";
import { useApp } from "./store";
import { STUDY_ZK } from "./data";
import type { Lecture } from "./types";

/** 공통 행 스타일 — hover/선택 시 얇은 박스 */
const row = (active: boolean) =>
  `flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-[12.5px] transition-colors ${
    active
      ? "border-white/25 bg-white/[0.09] text-white"
      : "border-transparent text-white/60 hover:border-white/15 hover:bg-white/[0.04] hover:text-white/90"
  }`;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">{children}</div>;
}

function StatusDot({ lec }: { lec: Lecture }) {
  if (lec.status === "ready") return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ember)]" />;
  if (lec.status === "failed") return <span className="shrink-0 text-[10px] leading-none text-red-400">✕</span>;
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-white/50" />;
}

function LectureRow({ lec, active, onClick }: { lec: Lecture; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={row(active)}>
      <FileText size={13} className="shrink-0 opacity-70" />
      <span className="flex-1 truncate">{lec.title}</span>
      <StatusDot lec={lec} />
      {lec.status === "processing" && (
        <span className="shrink-0 text-[10.5px] tabular-nums text-white/45">{Math.round(lec.progress)}%</span>
      )}
      {lec.status === "queued" && <span className="shrink-0 text-[10.5px] text-white/40">대기</span>}
    </button>
  );
}

export default function AppShell() {
  const { folders, lectures } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const activeLectureId = params.id;

  const [open, setOpen] = useState<Record<string, boolean>>({ is: true });
  const [query, setQuery] = useState("");

  const currentFolder = new URLSearchParams(location.search).get("folder");
  const onLibraryRoot = location.pathname === "/library" && !currentFolder;

  const recent = useMemo(
    () => [...lectures].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, 3),
    [lectures],
  );

  /* 검색: 제목 매칭 + 본문(스크립트) 매칭 → S# 위치로 진입 */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const byTitle = lectures.filter((l) => l.title.toLowerCase().includes(q));
    const byBody = STUDY_ZK.script
      .filter((s) => s.text.toLowerCase().includes(q))
      .slice(0, 3)
      .map((s) => ({ sentence: s, lecture: lectures.find((l) => l.id === "w10")! }))
      .filter((r) => r.lecture);
    return { byTitle, byBody };
  }, [query, lectures]);

  const gotoFolder = (folderId: string | null) => {
    setQuery("");
    navigate(folderId ? `/library?folder=${folderId}` : "/library");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ===== 다크 글래스 사이드바 ===== */}
      <aside className="shell-glass relative z-20 flex w-64 shrink-0 flex-col border-r">
        {/* 로고 */}
        <div className="px-4 pb-2 pt-4">
          <button onClick={() => navigate("/")} title="랜딩 페이지로" className="text-[17px] font-bold tracking-tight text-white">
            Lectra
          </button>
        </div>

        {/* 주 액션 */}
        <div className="px-3 pt-1">
          <button
            onClick={() => navigate(`${location.pathname.startsWith("/library") ? location.pathname + location.search : "/library"}${location.search.includes("upload") ? "" : (location.search ? "&" : "?") + "upload=1"}`)}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-[13px] font-semibold text-white transition-colors hover:bg-[#9A3412]"
          >
            <Plus size={15} strokeWidth={2.5} /> New lecture
          </button>
        </div>

        {/* 검색 (제목·본문) */}
        <div className="relative px-3 pt-2.5">
          <div className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-2.5">
            <Search size={13} className="shrink-0 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder="검색 (제목·본문)"
              className="w-full bg-transparent text-[12.5px] text-white placeholder:text-white/35 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-white/40 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>

          {/* 검색 결과 드롭다운 */}
          {results && (
            <div className="absolute left-3 right-3 top-[46px] z-50 rounded-lg border border-border bg-popover p-2 shadow-xl">
              <div className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                강의 제목 ({results.byTitle.length})
              </div>
              {results.byTitle.slice(0, 4).map((l) => (
                <button
                  key={l.id}
                  onClick={() => { setQuery(""); navigate(`/lecture/${l.id}`); }}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-[12.5px] text-card-foreground hover:bg-accent"
                >
                  {l.title} <span className="text-muted-foreground">· {folders.find((f) => f.id === l.folderId)?.name}</span>
                </button>
              ))}
              {results.byTitle.length === 0 && <div className="px-2 pb-1 text-[12px] text-muted-foreground">결과 없음</div>}
              {results.byBody.length > 0 && (
                <>
                  <div className="mt-1 border-t border-border px-2 py-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    본문 매칭 ({results.byBody.length})
                  </div>
                  {results.byBody.map(({ sentence, lecture }) => (
                    <button
                      key={sentence.id}
                      onClick={() => { setQuery(""); navigate(`/lecture/${lecture.id}?s=${sentence.slide}&t=${sentence.t}`); }}
                      className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-accent"
                    >
                      <span className="line-clamp-1 text-[12px] italic text-card-foreground">“…{sentence.text.slice(0, 42)}…”</span>
                      <span className="text-[11px] text-primary">→ {lecture.title} / S{sentence.slide}로 진입</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* ===== 구조화된 내비게이션 ===== */}
        <nav className="shell-scroll flex-1 overflow-y-auto px-3 pb-3">
          {/* 메뉴 */}
          <SectionLabel>메뉴</SectionLabel>
          <button onClick={() => gotoFolder(null)} className={row(onLibraryRoot)}>
            <LayoutGrid size={14} className="shrink-0" />
            <span className="flex-1 font-medium">전체 강의</span>
            <span className="text-[11px] tabular-nums opacity-55">{lectures.length}</span>
          </button>

          {/* 최근 */}
          <SectionLabel>최근</SectionLabel>
          <div className="space-y-0.5">
            {recent.map((l) => (
              <LectureRow key={l.id} lec={l} active={l.id === activeLectureId} onClick={() => navigate(`/lecture/${l.id}`)} />
            ))}
          </div>

          {/* 과목 (폴더 트리) */}
          <SectionLabel>과목</SectionLabel>
          <div className="space-y-0.5">
            {folders.map((f) => {
              const inFolder = lectures.filter((l) => l.folderId === f.id);
              const expanded = !!open[f.id];
              const isActive = currentFolder === f.id;
              return (
                <div key={f.id}>
                  <div className={`${row(isActive)} !p-0`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpen((o) => ({ ...o, [f.id]: !expanded })); }}
                      className="py-2 pl-2.5 pr-1 text-white/40 hover:text-white/80"
                    >
                      {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    <button onClick={() => gotoFolder(f.id)} className="flex flex-1 items-center gap-2 py-2 pr-2.5 text-left">
                      <FolderIcon size={13} className="shrink-0 opacity-80" />
                      <span className="flex-1 truncate font-medium">{f.name}</span>
                      <span className="text-[11px] tabular-nums opacity-55">{inFolder.length}</span>
                    </button>
                  </div>
                  {expanded && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                      {inFolder.map((l) => (
                        <LectureRow key={l.id} lec={l} active={l.id === activeLectureId} onClick={() => navigate(`/lecture/${l.id}`)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 px-2.5 text-[10px] leading-relaxed text-white/28">● 완료 · ○ 처리 중 · ✕ 실패</div>
        </nav>

        {/* 하단: 설정 + 프로필 */}
        <div className="border-t border-white/10 p-3">
          <button className={row(false)}>
            <Settings size={13} className="shrink-0" /> 설정
          </button>
          <div className="mt-1.5 flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-primary text-[11px] font-bold text-white">F</div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium text-white/90">focustation</div>
              <div className="text-[10.5px] text-white/40">Free plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== 워크스페이스 ===== */}
      <main className="ws-scroll relative flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
