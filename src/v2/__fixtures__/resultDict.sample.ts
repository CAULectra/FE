/* BE _build_result_dict(app/pipeline/process.py) 형태의 샘플 — studyAdapter 유닛테스트용.
   summary_note 에는 [s:N]/[s:N,M] 인용 마커를 실제 계약대로 포함한다. */
import type { ResultDict } from "../../api";

export const SAMPLE_RESULT: ResultDict = {
  job_id: "job-fixture-1",
  status: "완료",
  lecture_title: "정보보호이론",
  total_slides: 3,
  lecture_summary: "증명 시스템 → Σ-프로토콜 → Schnorr로 이어지는 한 줄기 흐름.",
  chapters: [
    {
      chapter_number: 1,
      title: "증명 시스템과 Σ-프로토콜",
      start_slide: 1,
      end_slide: 2,
      summary_note:
        "## 증명 시스템\n\n" +
        "- **대화형 증명** — P와 V가 메시지를 주고받으며 확률적으로 검증한다 [s:1].\n" +
        "- Σ-프로토콜은 announcement → challenge → response 3-move다 [s:2].\n\n" +
        "> [!note] 핵심\n> 세 화살표(a→c→r)는 이후 모든 프로토콜의 뼈대다 [s:1,2].",
      summary_explain: null,
    },
    {
      chapter_number: 2,
      title: "Schnorr 프로토콜",
      start_slide: 3,
      end_slide: 3,
      summary_note: "## Schnorr\n\n검증식 $g^s = y^c \\cdot \\beta$ 를 확인한다 [s:3].",
      summary_explain: null,
    },
  ],
  slides: [
    {
      slide_number: 1,
      title: "Proof Systems",
      key_point: "증명 시스템 개요",
      slide_text: "A proof system convinces a verifier.",
      slide_tables_formulas: "",
      blackboard: null,
      transcript_segments: [
        { start: 0, end: 12, text: "A proof system convinces a verifier of a statement." },
        { start: 12, end: 24, text: "Interactive proofs exchange messages probabilistically." },
      ],
      summary: null,
    },
    {
      slide_number: 2,
      title: "Σ-Protocol",
      key_point: "3-move",
      slide_text: "announcement, challenge, response",
      slide_tables_formulas: "",
      blackboard: { image_urls: ["https://cdn.example.com/board/s2-a.png"], ocr_text: "a -> c -> r" },
      transcript_segments: [{ start: 24, end: 40, text: "A sigma protocol has three moves." }],
      summary: null,
    },
    {
      slide_number: 3,
      title: "Schnorr's Protocol",
      key_point: "DL 지식 증명",
      slide_text: "prove knowledge of discrete log",
      slide_tables_formulas: "g^s = y^c beta",
      blackboard: null,
      transcript_segments: [{ start: 40, end: 60, text: "Schnorr proves knowledge of a discrete log." }],
      summary: null,
    },
  ],
  rag_index_id: "rag-fixture-1",
};
