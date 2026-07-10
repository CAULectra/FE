/* ================================================================
   WorkspacePage — /workspace (라이브러리와 분리된 '처리 현황' 뷰)
   업로드한 자료가 실시간으로 처리되는 과정을 과목별 직사각형 칩 + 진행바로 보여준다.
   상세 단계(6-step 등)는 사용자에게 노출하지 않음 — 여기선 진행바만.
   처리 중인 게 없으면 "현재 처리중인 과목이 없습니다".
   ================================================================ */
import { Folder, Inbox } from "lucide-react";
import { useApp } from "./store";

const ACTIVE = ["processing", "queued", "uploading"];

export default function WorkspacePage() {
  const { folders, lectures, authed } = useApp();

  const active = authed ? lectures.filter((l) => ACTIVE.includes(l.status)) : [];
  const groups = folders
    .map((f) => ({ folder: f, items: active.filter((l) => l.folderId === f.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-7">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-card-foreground">워크스페이스</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          업로드한 자료가 실시간으로 처리되는 현황{active.length ? ` · ${active.length}개 처리 중` : ""}
        </p>
      </div>

      {active.length === 0 ? (
        <div className="mt-28 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Inbox size={26} className="text-muted-foreground" />
          </div>
          <h2 className="mt-5 text-[19px] font-bold text-card-foreground">현재 처리중인 과목이 없습니다</h2>
          <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
            강의 자료를 업로드하면 여기에서 처리 과정을 실시간으로 볼 수 있어요.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-7">
          {groups.map(({ folder, items }) => (
            <section key={folder.id}>
              <div className="mb-3 flex items-center gap-2">
                <Folder size={14} className="text-muted-foreground" />
                <span className="text-[13.5px] font-bold text-card-foreground">{folder.name}</span>
                <span className="text-[12px] text-muted-foreground">· {items.length}개 처리 중</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((l) => {
                  const queued = l.status === "queued";
                  return (
                    <div
                      key={l.id}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-card-foreground">{l.title}</span>
                        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-primary">
                          {queued ? "대기" : `${Math.round(l.progress)}%`}
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r from-[var(--ember)] to-primary transition-all duration-700 ${queued ? "opacity-40" : ""}`}
                          style={{ width: `${queued ? 6 : Math.max(6, l.progress)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {queued ? `대기 중 · 큐 ${l.queueOrder ?? 1}번째` : l.status === "uploading" ? "업로드 중" : "분석 중"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
