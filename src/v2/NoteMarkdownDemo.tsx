/* ================================================================
   NoteMarkdownDemo — /note
   백엔드 note-v2(summary_note 마크다운) 렌더 + 사용자 편집 데모.
   · 읽기 ↔ 편집(분할: 원문 textarea + 실시간 미리보기) 토글
   · [s:N] 인용 칩 클릭 → 점프 토스트 (실연동 시 재생 위치 이동)
   실데이터 연동 전까지 계약과 동일한 샘플 마크다운(sampleNote.md)으로 시연.
   ================================================================ */
import { useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, Eye, Pencil, RotateCcw } from "lucide-react";
import MarkdownNote from "./study/MarkdownNote";
import SAMPLE_NOTE_MD from "./study/sampleNote.md?raw";

type Mode = "read" | "edit";

export default function NoteMarkdownDemo() {
  const [md, setMd] = useState<string>(SAMPLE_NOTE_MD);
  const [mode, setMode] = useState<Mode>("read");
  const [jump, setJump] = useState<string | null>(null);
  const jumpTimer = useRef<number | null>(null);

  const onCite = (slides: number[]) => {
    setJump(`S${slides.join(", ")} 원문/음성으로 점프 (실연동 시 재생 위치 이동)`);
    if (jumpTimer.current) window.clearTimeout(jumpTimer.current);
    jumpTimer.current = window.setTimeout(() => setJump(null), 2400);
  };

  const seg = (m: Mode, label: string, Icon: typeof Eye) => (
    <button
      onClick={() => setMode(m)}
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-semibold transition-all ${
        mode === m ? "bg-white text-primary shadow-[0_1px_4px_rgba(28,25,23,0.10)]" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon size={12} /> {label}
    </button>
  );

  return (
    <div className="flex h-screen flex-col bg-[#F5F1EA]">
      {/* 상단바 */}
      <header className="flex items-center gap-3 border-b border-[#E7E0D5] bg-white px-4 py-2.5">
        <Link to="/library" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted" title="라이브러리로">
          <ChevronLeft size={16} />
        </Link>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-[#1C1917]">AI 노트 · 영지식 증명 (3장)</span>
          <span className="text-[10.5px] text-muted-foreground">
            note-v2 계약 렌더링 · <code className="rounded bg-secondary px-1 py-0.5 text-[9.5px]">summary_note</code> 마크다운 + <code className="rounded bg-secondary px-1 py-0.5 text-[9.5px]">[s:N]</code> 인용
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {mode === "edit" && (
            <button
              onClick={() => setMd(SAMPLE_NOTE_MD)}
              className="flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              title="샘플 원문으로 되돌리기"
            >
              <RotateCcw size={12} /> 원본
            </button>
          )}
          <div className="flex gap-1 rounded-full bg-secondary p-1">
            {seg("read", "읽기", Eye)}
            {seg("edit", "편집", Pencil)}
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="relative min-h-0 flex-1">
        {mode === "read" ? (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-[720px] px-8 py-9">
              <MarkdownNote source={md} onCite={onCite} />
            </div>
          </div>
        ) : (
          <div className="grid h-full grid-cols-2 divide-x divide-[#E7E0D5]">
            <textarea
              value={md}
              onChange={(e) => setMd(e.target.value)}
              spellCheck={false}
              className="h-full w-full resize-none bg-[#FBF9F4] p-6 font-mono text-[12.5px] leading-[1.7] text-[#292524] focus:outline-none"
              aria-label="노트 마크다운 원문 편집"
            />
            <div className="h-full overflow-y-auto bg-white">
              <div className="mx-auto max-w-[680px] px-8 py-8">
                <MarkdownNote source={md} onCite={onCite} />
              </div>
            </div>
          </div>
        )}

        {/* 인용 칩 클릭 토스트 */}
        {jump && (
          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-[#1C1917] px-4 py-2 text-[12px] font-medium text-white shadow-lg">
            {jump}
          </div>
        )}
      </div>

      {/* 하단 설명 */}
      <footer className="border-t border-[#E7E0D5] bg-white px-4 py-2 text-[10.5px] leading-relaxed text-muted-foreground">
        이 화면은 백엔드 <b className="text-foreground">note-v2</b> 계약(<code className="rounded bg-secondary px-1 py-0.5">summary_note</code> 마크다운 + <code className="rounded bg-secondary px-1 py-0.5">[s:N]</code> 인용 마커)을 그대로 렌더합니다.
        편집 내용은 현재 로컬 상태에만 반영되며, 영구 저장은 백엔드 노트 수정 API 연동 시 연결됩니다.
      </footer>
    </div>
  );
}
