/* ================================================================
   exporters — 노트 내보내기 (프론트 전용, 라이브러리 없이 실제 다운로드)
   지원: Markdown(.md) · 자막(.srt) · Anki 카드(.csv)
   PDF(슬라이드 병합)·Word(.docx)는 FE로 부적합 → 메뉴에서 제외(BE 필요).
   ================================================================ */
import type { StudyData } from "../types";

export type ExportFormat = "md" | "srt" | "anki";

/** 파일명 안전화 — 공백→_, 위험문자 제거(한글 허용) */
function safeName(title: string): string {
  return (title || "lecture").trim().replace(/\s+/g, "_").replace(/[^\w가-힣._-]/g, "") || "lecture";
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Markdown ── 노트가 이미 마크다운(noteMd)이면 그대로, 없으면 요약으로 구성 */
function buildMarkdown(title: string, data: StudyData): string {
  const out: string[] = [`# ${title || data.courseName}`];
  if (data.overall) out.push("", "## 전체 요약", "", data.overall);
  for (const ch of data.chapters) {
    out.push("", `## ${ch.title} — ${ch.sub}`);
    if (ch.pages) out.push(`_${ch.pages}_`);
    out.push("");
    if (ch.noteMd) {
      out.push(ch.noteMd);
    } else {
      if (ch.intro) out.push(ch.intro, "");
      for (const s of ch.summary) out.push(`- ${s}`);
    }
  }
  return out.join("\n") + "\n";
}

/* ── SRT ── script(타임스탬프 문장)로 자막 생성. 종료=다음 문장 시작 or +4s */
function srtTime(sec: number): string {
  const clamped = Math.max(0, sec);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const ms = Math.round((clamped - Math.floor(clamped)) * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(ms, 3)}`;
}
function buildSrt(data: StudyData): string {
  const script = [...data.script].sort((a, b) => a.t - b.t);
  const blocks = script.map((s, i) => {
    const end = script[i + 1] ? script[i + 1].t : s.t + 4;
    return `${i + 1}\n${srtTime(s.t)} --> ${srtTime(end)}\n${s.text}\n`;
  });
  return blocks.join("\n");
}

/* ── Anki CSV ── 챕터 요약 포인트를 앞/뒤(front,back) 플래시카드로 */
function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}
function buildAnkiCsv(data: StudyData): string {
  const rows: [string, string][] = [];
  for (const ch of data.chapters) {
    ch.summary.forEach((point, i) => rows.push([`[${ch.sub}] 핵심 ${i + 1}`, point]));
  }
  if (rows.length === 0 && data.overall) rows.push(["강의 요약", data.overall]);
  return rows.map(([front, back]) => `${csvCell(front)},${csvCell(back)}`).join("\n");
}

/** 포맷별로 콘텐츠 생성 후 즉시 다운로드. 만들 데이터가 없으면 Error throw(호출부에서 토스트). */
export function exportNote(format: ExportFormat, title: string, data: StudyData): void {
  const base = safeName(title || data.courseName);
  if (format === "md") {
    download(`${base}.md`, buildMarkdown(title, data), "text/markdown;charset=utf-8");
    return;
  }
  if (format === "srt") {
    const srt = buildSrt(data);
    if (!srt.trim()) throw new Error("녹음 스크립트가 없어 자막(.srt)을 만들 수 없어요.");
    download(`${base}.srt`, srt, "text/plain;charset=utf-8");
    return;
  }
  // anki — Excel/한글에서 안 깨지도록 UTF-8 BOM 추가
  const csv = buildAnkiCsv(data);
  if (!csv.trim()) throw new Error("카드로 만들 요약이 없어요.");
  download(`${base}_anki.csv`, "﻿" + csv, "text/csv;charset=utf-8");
}
