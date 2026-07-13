/* ================================================================
   UploadModal — 와이어프레임 3.0~3.2 (Library 위 모달)
   필수: 슬라이드 PDF/PPT + 녹음(.mp3 .wav .m4a — 영상 X)
   선택: 사진 여러 장 (EXIF 촬영 시각으로 타임라인·노트 자동 배치)
   Start analysis 는 필수 2종 검증 통과 시에만 활성 + 비활성 사유 노출
   ================================================================ */
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, FileText, ImagePlus, Mic, Sparkles, X } from "lucide-react";
import { useApp } from "./store";
import { api, ApiError } from "../api";
import { UNCATEGORIZED_FOLDER_ID } from "./adapters";

type ZoneKey = "pdf" | "audio" | "photo";
interface PickedFile { file: File; name: string; sizeMB: number; progress: number }

const ACCEPT: Record<ZoneKey, { exts: string[]; label: string }> = {
  pdf:   { exts: ["pdf", "ppt", "pptx"], label: ".pdf .ppt .pptx" },
  audio: { exts: ["mp3", "wav", "m4a"],  label: ".mp3 .wav .m4a" },
  photo: { exts: ["jpg", "jpeg", "png", "heic"], label: ".jpg .png .heic" },
};

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
const fmtMB = (mb: number) => (mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(mb * 1024)} KB`);

export default function UploadModal({ defaultFolderId, onClose }: { defaultFolderId: string | null; onClose: () => void }) {
  const { folders, registerJob, addFolder } = useApp();
  const navigate = useNavigate();

  // 폴더 안에서 열렸으면(=defaultFolderId 지정) 폴더 선택 없이 그 폴더에 바로 추가
  const inFolder = defaultFolderId != null;
  const targetFolderName = inFolder ? folders.find((f) => f.id === defaultFolderId)?.name : undefined;

  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId ?? folders[0]?.id ?? "");
  const [files, setFiles] = useState<Record<ZoneKey, PickedFile[]>>({ pdf: [], audio: [], photo: [] });
  const [errors, setErrors] = useState<Partial<Record<ZoneKey, string>>>({});
  const [dragOver, setDragOver] = useState<ZoneKey | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const inputRefs = { pdf: useRef<HTMLInputElement>(null), audio: useRef<HTMLInputElement>(null), photo: useRef<HTMLInputElement>(null) };

  const pick = (zone: ZoneKey, list: FileList | File[]) => {
    const arr = Array.from(list);
    const bad = arr.find((f) => !ACCEPT[zone].exts.includes(extOf(f.name)));
    if (bad) {
      setErrors((e) => ({ ...e, [zone]: `지원 형식 아님 (선택: ${bad.name})` }));
      return;
    }
    setErrors((e) => ({ ...e, [zone]: undefined }));
    const picked = arr.map((f) => ({ file: f, name: f.name, sizeMB: f.size / 1024 / 1024, progress: 0 }));
    setFiles((prev) => ({ ...prev, [zone]: zone === "photo" ? [...prev.photo, ...picked] : picked.slice(0, 1) }));
  };

  const pdfOk = files.pdf.length > 0 && !errors.pdf;
  const canStart = pdfOk && !uploading;         // 슬라이드(PDF/PPT)만 필수 — 녹음·사진은 선택
  const disabledReason = uploading ? null
    : !pdfOk ? (errors.pdf ? `슬라이드 형식 오류 — ${errors.pdf}` : "슬라이드(PDF/PPT)가 필요합니다")
    : null;

  /* 실제 업로드 파이프라인: PDF → (녹음) → (사진) → process → 폴링 등록 → 워크스페이스.
     각 단계 완료 시 해당 zone 진행바를 100%로. 실패 시 사유 노출하고 업로드 상태 해제. */
  const markDone = (zone: ZoneKey) =>
    setFiles((prev) => ({ ...prev, [zone]: prev[zone].map((f) => ({ ...f, progress: 100 })) }));

  const startUpload = async () => {
    if (!canStart) return;
    const finalTitle = title.trim() || files.pdf[0]?.name.replace(/\.[^.]+$/, "") || "새 강의";
    setUploadError(null);
    setUploading(true);
    try {
      // 실 폴더에만 folder_id 전달 (미분류/빈값은 생략 → BE가 폴더 없이 생성) — #9
      const uploadFolderId = folderId && folderId !== UNCATEGORIZED_FOLDER_ID ? folderId : undefined;
      const { lecture_id } = await api.uploadPdf(finalTitle, files.pdf[0].file, uploadFolderId);
      markDone("pdf");
      if (files.audio.length > 0) {
        await api.uploadAudio(lecture_id, files.audio[0].file);
        markDone("audio");
      }
      if (files.photo.length > 0) {
        await api.uploadBoard(lecture_id, files.photo.map((f) => f.file));
        markDone("photo");
      }
      const job = await api.process(lecture_id);
      registerJob({
        id: lecture_id,
        jobId: job.job_id,
        title: finalTitle,
        folderId,
        hasAudio: files.audio.length > 0,
        photoCount: files.photo.length,
        status: job.status,
      });
      onClose();
      navigate("/workspace");
    } catch (e) {
      setUploading(false);
      // #34: 베타 게이트 403(BETA_ONLY) → 안내 메시지
      if (e instanceof ApiError && e.status === 403) {
        setUploadError("정식 출시 준비 중이에요 — 지금은 베타 참여자만 업로드할 수 있어요.");
      } else {
        setUploadError(e instanceof Error ? e.message : "업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    }
  };

  const overall = (() => {
    const all = [...files.pdf, ...files.audio, ...files.photo];
    if (!all.length) return 0;
    return Math.round(all.reduce((s, f) => s + f.progress, 0) / all.length);
  })();

  const Zone = ({ zone, icon, label, required, optional }: { zone: ZoneKey; icon: React.ReactNode; label: string; required?: boolean; optional?: boolean }) => (
    <div>
      <div className="mb-1.5 flex items-center gap-1 text-[12.5px] font-semibold text-card-foreground">
        {label} {required && <span className="text-primary">*</span>}
        {optional && <span className="text-[10.5px] font-normal text-muted-foreground">(선택)</span>}
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(zone); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => { e.preventDefault(); setDragOver(null); pick(zone, e.dataTransfer.files); }}
        onClick={() => inputRefs[zone].current?.click()}
        className={`flex min-h-[86px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors ${
          dragOver === zone ? "border-primary bg-accent" : errors[zone] ? "border-destructive/60 bg-red-50/50" : "border-border bg-[#FBFAF8] hover:border-primary/50 hover:bg-accent/50"
        }`}
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="mt-1.5 text-[12px] font-medium text-foreground">끌어다 놓거나 클릭</span>
        <span className="mt-0.5 text-[10.5px] text-muted-foreground">{ACCEPT[zone].label}</span>
      </div>
      <input
        ref={inputRefs[zone]} type="file" hidden multiple={zone === "photo"}
        accept={ACCEPT[zone].exts.map((e) => "." + e).join(",")}
        onChange={(e) => e.target.files && pick(zone, e.target.files)}
      />
      {errors[zone] && (
        <p className="mt-1.5 flex items-center gap-1 text-[11.5px] font-medium text-destructive">
          <AlertTriangle size={11} /> {errors[zone]}
        </p>
      )}
      {files[zone].map((f) => (
        <div key={f.name} className="mt-1.5 rounded-md bg-secondary px-2.5 py-1.5">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="truncate font-medium text-foreground">{f.name}</span>
            <span className="ml-2 shrink-0 tabular-nums text-muted-foreground">
              {uploading ? (f.progress >= 100 ? "완료" : `${Math.round(f.progress)}%`) : fmtMB(f.sizeMB)}
            </span>
          </div>
          {uploading && f.progress < 100 && (
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#E8E4DE]">
              <div className="h-full rounded-full bg-[var(--ember)] transition-all duration-300" style={{ width: `${f.progress}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-[19px] font-bold text-card-foreground">새 강의 업로드</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X size={17} /></button>
        </div>

        {/* Title (/ Folder) — 폴더 안에서 열면 폴더 선택 없이 제목만 전체 폭 */}
        <div className={`mt-5 grid grid-cols-1 gap-4 ${inFolder ? "" : "sm:grid-cols-2"}`}>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-card-foreground">제목</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 12주차 - 그래프"
              className="h-10 w-full rounded-lg border border-border bg-[var(--input-background)] px-3 text-[13.5px] placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(194,65,12,0.12)]"
            />
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              미입력 시 파일명이 제목이 됩니다{inFolder && targetFolderName ? ` · '${targetFolderName}' 폴더에 추가됩니다` : ""}
            </p>
          </div>
          {!inFolder && (
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-card-foreground">폴더</label>
              {newFolderMode ? (
                <div className="flex gap-1.5">
                  <input
                    autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && newFolderName.trim()) {
                        const id = await addFolder(newFolderName); if (id) setFolderId(id);
                        setNewFolderMode(false); setNewFolderName("");
                      }
                      if (e.key === "Escape") setNewFolderMode(false);
                    }}
                    placeholder="예: 확률및통계"
                    className="h-10 w-full rounded-lg border border-border bg-[var(--input-background)] px-3 text-[13.5px] focus:border-primary focus:outline-none"
                  />
                </div>
              ) : (
                <select
                  value={folderId} onChange={(e) => e.target.value === "__new__" ? setNewFolderMode(true) : setFolderId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-[var(--input-background)] px-3 text-[13.5px] focus:border-primary focus:outline-none"
                >
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  <option value="__new__">+ 새 폴더…</option>
                </select>
              )}
            </div>
          )}
        </div>

        {/* 필수: 슬라이드 PDF/PPT */}
        <div className="mt-5">
          <Zone zone="pdf" icon={<FileText size={19} />} label="슬라이드 PDF / PPT" required />
        </div>

        {/* 선택 자료: 녹음 + 사진 (동등선상) */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Zone zone="audio" icon={<Mic size={19} />} label="녹음 파일" optional />
          <Zone zone="photo" icon={<ImagePlus size={19} />} label="사진 (필기·판서)" optional />
        </div>

        {/* 액션 */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-[13px] font-medium text-foreground hover:bg-secondary">취소</button>
          <button
            disabled={!canStart}
            onClick={startUpload}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles size={14} /> {uploading ? `업로드 중 ${overall}%` : "분석 시작"}
          </button>
        </div>
        {uploadError && (
          <p className="mt-2 flex items-center justify-end gap-1 text-right text-[11.5px] font-medium text-destructive">
            <AlertTriangle size={11} /> {uploadError}
          </p>
        )}
        {disabledReason && !canStart && !uploadError && (
          <p className="mt-2 text-right text-[11.5px] text-muted-foreground">{disabledReason}</p>
        )}
        {uploading && (
          <p className="mt-2 text-right text-[11.5px] text-muted-foreground">업로드 후 자동으로 분석이 시작됩니다 · 워크스페이스에서 진행률을 확인하세요</p>
        )}
      </div>
    </div>
  );
}
