/* ================================================================
   MarkdownNote — note-v2 계약 마크다운 렌더러
   백엔드 summary_note(마크다운 문자열)를 그대로 렌더:
   - GFM 표/리스트/체크박스            (remark-gfm)
   - LaTeX 수식 $...$ / $$...$$        (remark-math + rehype-katex)
   - Obsidian callout > [!note]       (remarkCallouts → div.md-callout-*)
   - 문장끝 [s:N] 인용 마커 → 클릭 칩   (remarkCitations → <cite-chip>)
   스타일은 markdown-note.css(.md-note prose)로 스코프.
   ================================================================ */
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import "./markdown-note.css";
import { remarkCitations } from "./remarkCitations";
import { remarkCallouts } from "./remarkCallouts";

/** 인용 칩 클릭 → 근거 슬라이드 번호들 전달 (실연동 시 재생 위치/슬라이드 이동) */
export type CiteHandler = (slides: number[]) => void;

function CiteChip({ slides, onCite }: { slides: string; onCite?: CiteHandler }) {
  const nums = slides
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n));
  return (
    <button
      type="button"
      className="s-cite"
      title="원문 슬라이드/음성으로 이동"
      onClick={() => onCite?.(nums)}
    >
      S{slides}
    </button>
  );
}

export default function MarkdownNote({ source, onCite }: { source: string; onCite?: CiteHandler }) {
  /* cite-chip은 커스텀 엘리먼트라 표준 Components 타입에 없음 → 지역 캐스팅 */
  const components = {
    "cite-chip": ({ node }: { node?: { properties?: { dataSlides?: string } } }) => (
      <CiteChip slides={String(node?.properties?.dataSlides ?? "")} onCite={onCite} />
    ),
  } as unknown as Components;

  return (
    <div className="md-note">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkCallouts, remarkCitations]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
