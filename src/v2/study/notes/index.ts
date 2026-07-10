/* ================================================================
   note-v2 계약 형식의 챕터 노트 샘플 (실 API 연동 전 중앙 노트 렌더 시연용).
   실연동 시 chapters[].noteMd는 백엔드 chapters[].summary_note(마크다운)로 대체된다.
   ================================================================ */
import zkCh1 from "./zk-ch1.md?raw";
import zkCh2 from "./zk-ch2.md?raw";
import zkCh3 from "./zk-ch3.md?raw";
import zkCh4 from "./zk-ch4.md?raw";

export const ZK_CHAPTER_NOTES: string[] = [zkCh1, zkCh2, zkCh3, zkCh4];
