/* ================================================================
   remarkCitations — note-v2 인용 마커 플러그인
   본문 마크다운의 [s:N] / [s:N,M] / [s:N-M] 마커를 커스텀 노드로 치환한다.
   백엔드 계약(summarize.py): 본문 텍스트는 마커를 그대로 두고, "렌더링 쪽에서
   칩으로 변환"이 프론트 책임 → 여기서 mdast text를 <cite-chip data-slides="N,M">로 바꿔
   MarkdownNote가 클릭 가능한 인용 칩으로 렌더한다.
   근거: lectra_BE/app/pipeline/summarize.py  _INLINE_CITE_RE = \[s:([\d,\s\-]+)\]
   ================================================================ */
import { SKIP, visit } from "unist-util-visit";
import type { Root, Text } from "mdast";

/** [s:7] / [s:7,9] / [s:7-9] — 백엔드 정규식과 동일 문법 */
const CITE_SRC = String.raw`\[s:([\d,\s-]+)\]`;

export function remarkCitations() {
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (parent == null || index == null) return;

      const re = new RegExp(CITE_SRC, "g");
      const value = node.value;
      if (!re.test(value)) return;
      re.lastIndex = 0;

      const parts: unknown[] = [];
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(value)) !== null) {
        if (m.index > last) {
          parts.push({ type: "text", value: value.slice(last, m.index) });
        }
        const slides = m[1].replace(/\s+/g, "");
        parts.push({
          // 커스텀 노드 — data.hName으로 hast 엘리먼트(cite-chip)로 변환됨
          type: "citeChip",
          data: {
            hName: "cite-chip",
            hProperties: { dataSlides: slides },
            hChildren: [{ type: "text", value: `S${slides}` }],
          },
        });
        last = m.index + m[0].length;
      }
      if (last < value.length) {
        parts.push({ type: "text", value: value.slice(last) });
      }

      // 원본 text 노드를 분해된 노드들로 치환하고, 삽입분 이후로 순회 이동
      parent.children.splice(index, 1, ...(parts as Root["children"]));
      return [SKIP, index + parts.length];
    });
  };
}
