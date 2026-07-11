# 온디맨드 3종 배선 — 설계 & 구현 플랜

- **작성일**: 2026-07-11
- **담당**: 김민지 (AI2/RAG + FE 통합)
- **대상 앱**: `FE-lectra` (branch `main` → 작업은 `feat/ondemand-wiring`)
- **한 줄**: 백엔드에 이미 배포된 온디맨드 3종(슬라이드 번역·슬라이드 요약·챕터 설명)을 `src/v2` UI에 실연동한다. 새 API 구현이 아니라 **기존 계약 클라이언트(`src/api/real.ts`) 연결 + 온디맨드 결과 캐시**.
- **구현 상태 (2026-07-11)**: P0–P4 완료. `typecheck`·`vitest`(10/10)·`vite build` 모두 green. 브랜치 `feat/ondemand-wiring`. exam 버튼/목 완전 삭제. ⚠️ 라이브 클릭 스모크(실 토큰+완료 강의)는 미실시.

## 배경 (검증된 사실)

- 세 엔드포인트 모두 `api.lectranote.com`에 **라이브 배포됨** (401 스모크 + 코드 조상 확인, 2026-07-11):
  - `POST /lectures/{id}/slides/{n}/translate` `{target_language}` → `{translated_text}` — `slide_text`만 번역, 이미지-only는 `""`, **캐시 안 함**.
  - `POST /lectures/{id}/slides/{n}/summary` → `{summary}` — 첫 호출만 LLM, 이후 백엔드 캐시.
  - `POST /lectures/{id}/chapters/{n}/summary-explain` → `{summary_explain}` — 동일 캐시.
- 계약 레이어(`src/api/real.ts` `translateSlide`/`slideSummary`/`chapterSummaryExplain` + `src/api/types.ts` 응답 타입)는 **이미 완성**. 빈틈은 `src/v2` UI가 호출하지 않는 것뿐.
- **exam("예상 시험문제")**: 백엔드 어느 브랜치에도 없는 **FE 프로토타입 목**(`v2/api.ts:59-72` + `RefPanel.tsx:288`). → **완전 삭제**(이번 결정).

## 승인된 설계

| 기능 | 트리거 | 실 호출 | 표시 | 캐시 |
|---|---|---|---|---|
| 슬라이드 번역 | 번역 탭: 언어 select + `현재 슬라이드 번역` 버튼 | `translateSlide(id, slideN, langCode)` | 탭을 *챕터요약 → 현재 슬라이드 번역*으로 교체. `translated_text` 표시, `""`면 "이 슬라이드는 이미지라 번역할 본문이 없어요" 안내 | RefPanel 로컬 `Map<"slideN:lang", string>` |
| 슬라이드 요약 | 챗봇 탭: `이 슬라이드 요약` 버튼 | `slideSummary(id, slideN)` | 챗 스레드 AI 버블(인용 없음) | 불필요(챗 누적) |
| 챕터 설명 | 노트 헤더: `이 챕터 설명` 버튼(신설) | `chapterSummaryExplain(id, chapterNum)` | 요약 콜아웃 아래 접이식 영역에 `MarkdownNote` 렌더 | NotePane 로컬 `Record<chapterNum, string>` |

- **유일한 seam**: mock/real 게이트는 이미 `src/api`(`api = USE_MOCK ? mockApi : realApi`)에 있고 `mockApi`가 3종을 데모 텍스트로 구현함. 따라서 `src/v2/api.ts` 래퍼는 **USE_MOCK 분기 없이** 이미 게이트된 `backend`를 호출하고 응답 **형태만 변환**한다. (실측으로 스펙보다 단순해진 지점)
- **필수 플러밍**: `Chapter` 타입에 `chapterNumber`(백엔드 `chapter_number`) 추가 + 어댑터 매핑. (슬라이드는 `Slide.n`=slide_number라 OK.)
- **언어값 매핑**: English→`en` / 日本語→`ja` / 中文→`zh` / Español→`es` (계약 예시 `{target_language:"en"}` 준수).

### 범위 밖 (명시)
- 챗봇 RAG **Q&A 자체는 목 유지**(실 RAG 엔드포인트 없음 = Track B).
- 어댑터의 `key_point`/`slide_tables_formulas`/`rag_index_id`·폴더 CRUD·`GET /lectures` 필드 확장 = 별도 Track.

## 우선순위 구현 플랜 (TDD)

> 원칙: 저위험·빠른 승리 먼저, 공통 토대(P0) 우선. 각 단계 테스트 먼저 작성.

- **P0 — 토대 (플러밍 + 래퍼 + 테스트)**
  - `feat/ondemand-wiring` 브랜치 생성.
  - `v2/types.ts`: `Chapter.chapterNumber:number` 추가. `v2/studyAdapter.ts`: `chapterNumber: c.chapter_number` 매핑.
  - `v2/api.ts`: `slideSummary`/`chapterExplain`/`translateSlideText` 형태 변환 래퍼 추가(게이트는 src/api). 목 `ragQuickAction`(summary+exam) **완전 제거**.
  - vitest: 래퍼 3종 분기·응답 매핑 + 어댑터 `chapterNumber` 매핑 단위 테스트.
- **P1 — 슬라이드 요약 (가장 작음)**
  - `RefPanel.tsx` `quick()`: summary → 실 `slideSummary` 래퍼. **exam 버튼·`quick("exam")` 삭제.**
- **P2 — 챕터 설명**
  - `NotePane.tsx` 헤더에 `이 챕터 설명` 버튼 + 접이식 `MarkdownNote` + 챕터별 캐시 + 스피너. (P0의 `chapterNumber` 의존.)
- **P3 — 번역 탭 재설계 (가장 큼)**
  - `RefPanel.tsx` 번역 탭을 per-slide 온디맨드로 교체: 언어 select + `현재 슬라이드 번역` 버튼 + `Map` 캐시 + 이미지-only 안내 + 스피너. 기존 `chaptersEn/overallEn` 의존 제거.
- **P4 — 검증**
  - `vitest` 전체 통과 + `npm run build` 타입 통과.
  - (가능 시) dev(real 모드)에서 완료된 강의 + 토큰으로 3종 실호출 스모크.

## 위험 / 주의
- 번역 탭은 UI 의미가 바뀜(챕터→슬라이드) → 사용자에게 가장 눈에 띄는 변화. 마지막(P3)에 배치.
- 실모드 스모크는 완료된 강의 + 유효 토큰 필요 → 없으면 목/픽스처로만 검증하고 실호출은 보류(문서에 명시).
- `USE_MOCK` 기본 true(프로덕션=목) → 이 작업은 **dev 실모드**에서 검증. 프로덕션 실모드 전환은 별도 Track D.
