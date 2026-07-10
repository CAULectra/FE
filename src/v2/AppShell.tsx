/* ================================================================
   AppShell — 다크 프로스트 글래스 사이드바 (Command Center 시그니처)
   구조화된 섹션: 메뉴 / 최근 / 과목(폴더 트리)
   모든 행 = 아이콘+라벨, hover·선택 시 얇은 박스(보더)로 표시
   ================================================================ */
import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router";
import {
  Activity, Folder as FolderIcon, LayoutGrid, Plus, Search, Settings, Star, X,
} from "lucide-react";
import { useApp } from "./store";
import { STUDY_ZK } from "./data";
import AuthModal from "./AuthModal";

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

export default function AppShell() {
  const { folders, lectures, authed, login, favorites } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const authOpen = searchParams.get("auth") === "1";
  /* 게스트는 사이드바(폴더/최근/검색)도 비어 보인다 */
  const visFolders = authed ? folders : [];
  const visLectures = authed ? lectures : [];
  const processingCount = visLectures.filter((l) => l.status === "processing" || l.status === "queued" || l.status === "uploading").length;
  const favCount = authed ? favorites.length : 0;
  /* 최근: 과목(폴더)을 최근 활동순으로 — 각 폴더의 최신 강의 업로드일 기준 */
  const latestOf = (fid: string) => visLectures.filter((l) => l.folderId === fid).reduce((m, l) => (l.uploadedAt > m ? l.uploadedAt : m), "");
  const recentFolders = [...visFolders].sort((a, b) => latestOf(b.id).localeCompare(latestOf(a.id)));

  const [query, setQuery] = useState("");

  const currentFolder = new URLSearchParams(location.search).get("folder");
  const onLibraryRoot = location.pathname === "/library" && !currentFolder;

  /* 검색: 제목 매칭 + 본문(스크립트) 매칭 → S# 위치로 진입 */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !authed) return null;
    const byTitle = lectures.filter((l) => l.title.toLowerCase().includes(q));
    const byBody = STUDY_ZK.script
      .filter((s) => s.text.toLowerCase().includes(q))
      .slice(0, 3)
      .map((s) => ({ sentence: s, lecture: lectures.find((l) => l.id === "w10")! }))
      .filter((r) => r.lecture);
    return { byTitle, byBody };
  }, [query, lectures, authed]);

  const gotoFolder = (folderId: string | null) => {
    setQuery("");
    navigate(folderId ? `/library?folder=${folderId}` : "/library");
  };

  /* New lecture — 게스트면 로그인/회원가입 창부터 (업로드 인증 게이트) */
  const onNewLecture = () => {
    if (!authed) { searchParams.set("auth", "1"); setSearchParams(searchParams); return; }
    if (location.pathname.startsWith("/library")) { searchParams.set("upload", "1"); setSearchParams(searchParams); }
    else navigate("/library?upload=1");
  };
  const closeAuth = () => { searchParams.delete("auth"); setSearchParams(searchParams, { replace: true }); };
  const onLogin = () => { login(); searchParams.delete("auth"); setSearchParams(searchParams, { replace: true }); };

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
            onClick={onNewLecture}
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
          {/* 메뉴 — 라이브러리 / 워크스페이스 / 즐겨찾기 (행 스타일·크기 통일) */}
          <SectionLabel>메뉴</SectionLabel>
          <div className="space-y-0.5">
            <button onClick={() => gotoFolder(null)} className={row(onLibraryRoot)}>
              <LayoutGrid size={14} className="shrink-0" />
              <span className="flex-1 font-medium">라이브러리</span>
              <span className="text-[11px] tabular-nums opacity-55">{visLectures.length}</span>
            </button>
            <button onClick={() => navigate("/workspace")} className={row(location.pathname === "/workspace")}>
              <Activity size={14} className="shrink-0" />
              <span className="flex-1 font-medium">워크스페이스</span>
              {processingCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">{processingCount}</span>
              )}
            </button>
            <button onClick={() => navigate("/favorites")} className={row(location.pathname === "/favorites")}>
              <Star size={14} className="shrink-0" />
              <span className="flex-1 font-medium">즐겨찾기</span>
              {favCount > 0 && <span className="text-[11px] tabular-nums opacity-55">{favCount}</span>}
            </button>
          </div>

          {/* 최근 — 과목을 폴더 모양으로 (최근 활동순) */}
          <SectionLabel>최근</SectionLabel>
          <div className="space-y-0.5">
            {recentFolders.map((f) => (
              <button key={f.id} onClick={() => gotoFolder(f.id)} className={row(currentFolder === f.id)}>
                <FolderIcon size={14} className="shrink-0 opacity-80" />
                <span className="flex-1 truncate font-medium">{f.name}</span>
                <span className="text-[11px] tabular-nums opacity-55">{visLectures.filter((l) => l.folderId === f.id).length}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* 하단: 설정 + 프로필 */}
        <div className="border-t border-white/10 p-3">
          <button className={row(false)}>
            <Settings size={13} className="shrink-0" /> 설정
          </button>
          {authed ? (
            <div className="mt-1.5 flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-primary text-[11px] font-bold text-white">F</div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-white/90">focustation</div>
                <div className="text-[10.5px] text-white/40">Free plan</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { searchParams.set("auth", "1"); setSearchParams(searchParams); }}
              className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-2 text-[12px] font-semibold text-white/90 transition-colors hover:bg-white/[0.1]"
            >
              로그인 / 회원가입
            </button>
          )}
        </div>
      </aside>

      {/* ===== 워크스페이스 ===== */}
      <main className="ws-scroll relative flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* 인증 필요 액션(업로드)에서 뜨는 로그인/회원가입 창 */}
      {authOpen && <AuthModal onClose={closeAuth} onLogin={onLogin} />}
    </div>
  );
}
