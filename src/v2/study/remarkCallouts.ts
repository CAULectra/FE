/* ================================================================
   remarkCallouts — Obsidian callout(> [!note] ...) → 스타일 div
   백엔드 계약: summary_note에 > [!note] / [!important] / [!example] / [!warning]
   callout이 포함될 수 있다(챕터당 ≤4). blockquote 첫 문단이 [!type]로 시작하면
   마커를 떼어내고 div.md-callout-{type}로 변환한다. 내부 마크다운(굵게/인용칩/
   리스트/수식)은 mdast 단계에서 변환하므로 그대로 보존된다.
   근거: lectra_BE/docs/note-v2-contract-proposal.md
   ================================================================ */
import { visit } from "unist-util-visit";
import type { Blockquote, Paragraph, Root, Text } from "mdast";

// 마커 + 인라인 공백만 매치(줄바꿈 이후 제목/본문은 보존). $ 앵커를 쓰면
// "> [!note] 정의\n> 본문"의 소프트 줄바꿈(\n) 때문에 매치 실패한다.
const CALLOUT_RE = /^\[!(\w+)\][ \t]*/;

export function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0] as Paragraph | undefined;
      if (!first || first.type !== "paragraph") return;
      const lead = first.children[0] as Text | undefined;
      if (!lead || lead.type !== "text") return;

      const m = CALLOUT_RE.exec(lead.value);
      if (!m) return;

      const type = m[1].toLowerCase();

      // 마커만 제거하고 제목·본문(줄바꿈 포함)은 그대로 유지
      lead.value = lead.value.slice(m[0].length);
      if (!lead.value) {
        first.children.shift();
        if (first.children.length === 0) node.children.shift();
      }

      // blockquote → div.md-callout-{type} (스타일은 markdown-note.css)
      (node as { data?: Record<string, unknown> }).data = {
        hName: "div",
        hProperties: { className: ["md-callout", `md-callout-${type}`] },
      };
    });
  };
}
