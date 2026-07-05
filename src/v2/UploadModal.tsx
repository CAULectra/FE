/* ================================================================
   UploadModal — 와이어프레임 3.0~3.2 (Library 위 모달)
   필수: 슬라이드 PDF/PPT + 녹음(.mp3 .wav .m4a — 영상 X)
   선택: 사진 여러 장 (EXIF 촬영 시각으로 타임라인·노트 자동 배치)
   Start analysis 는 필수 2종 검증 통과 시에만 활성 + 비활성 사유 노출
   ================================================================ */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, FileText, ImagePlus, Mic, Sparkles, X } from "lucide-react";
import { useApp } from "./store";

type ZoneKey = "pdf" | "audio" | "photo";
interface PickedFile { name: string; sizeMB: number; progress: number }

const ACCEPT: Record<ZoneKey, { exts: string[]; label: string }> = {
  pdf:   { exts: ["pdf", "ppt", "pptx"], label: ".pdf .ppt .pptx" },
  audio: { exts: ["mp3", "wav", "m4a"],  label: ".mp3 .wav .m4a — 녹음만 (영상 X)" },
  photo: { exts: ["jpg", "jpeg", "png", "heic"], label: ".jpg .png .heic" },
};

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
const fmtMB = (mb: number) => (mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(mb * 1024)} KB`);

export default function UploadModal({ defaultFolderId, onClose }: { defaultFolderId: string | null; onClose: () => void }) {
  const { folders, addLecture, addFolder } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId ?? folders[0]?.id ?? "");
  const [files, setFiles] = useState<Record<ZoneKey, PickedFile[]>>({ pdf: [], audio: [], photo: [] });
  const [errors, setErrors] = useState<Partial<Record<ZoneKey, string>>>({});
  const [dragOver, setDragOver] = useState<ZoneKey | null>(null);
  const [uploading, setUploading] = useState(false);
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
    const picked = arr.map((f) => ({ name: f.name, sizeMB: f.size / 1024 / 1024, progress: 0 }));
    setFiles((prev) => ({ ...prev, [zone]: zone === "photo" ? [...prev.photo, ...picked] : picked.slice(0, 1) }));
  };

  const pdfOk = files.pdf.length > 0 && !errors.pdf;
  const audioOk = files.audio.length > 0 && !errors.audio;
  const canStart = pdfOk && audioOk && !uploading;
  const disabledReason = uploading ? null
    : !pdfOk && !audioOk ? "슬라이드(PDF/PPT)와 녹음 파일이 필요합니다"
    : !pdfOk ? (errors.pdf ? `슬라이드 형식 오류 — ${errors.pdf}` : "슬라이드(PDF/PPT)가 필요합니다")
    : !audioOk ? (errors.audio ? `오디오 형식 오류 — ${errors.audio}` : "녹음 파일이 없습니다")
    : null;

  /* 업로드 진행 시뮬레이션 → 완료 시 lecture 생성 후 강의 페이지로 */
  useEffect(() => {
    if (!uploading) return;
    const iv = setInterval(() => {
      setFiles((prev) => {
        const step = (f: PickedFile, speed: number) => ({ ...f, progress: Math.min(100, f.progress + speed) });
        const next = {
          pdf: prev.pdf.map((f) => step(f, 22)),
          audio: prev.audio.map((f) => step(f, 9)),
          photo: prev.photo.map((f) => step(f, 30)),
        };
        const all = [...next.pdf, ...next.audio, ...next.photo];
        if (all.every((f) => f.progress >= 100)) {
          clearInterval(iv);
          const finalTitle = title.trim() || files.pdf[0]?.name.replace(/\.[^.]+$/, "") || "새 강의";
          const id = addLecture({
            title: finalTitle,
            folderId,
            hasAudio: true,
            slideCount: 12 + Math.floor(Math.random() * 12),
            photoCount: next.photo.length,
            audioSec: 3200 + Math.floor(Math.random() * 1200),
          });
          setTimeout(() => navigate(`/lecture/${id}`), 250);
        }
        return next;
      });
    }, 300);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploading]);

  const overall = (() => {
    const all = [...files.pdf, ...files.audio, ...files.photo];
    if (!all.length) return 0;
    return Math.round(all.reduce((s, f) => s + f.progress, 0) / all.length);
  })();

  const Zone = ({ zone, icon, label, required }: { zone: ZoneKey; icon: React.ReactNode; label: string; required?: boolean }) => (
    <div>
      <div className="mb-1.5 flex items-center gap-1 text-[12.5px] font-semibold text-card-foreground">
        {label} {required && <span className="text-primary">*</span>}
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
        <span className="mt-1.5 text-[12px] font-medium text-foreground">drop or browse</span>
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
          <h2 className="text-[19px] font-bold text-card-foreground">Upload new lecture</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X size={17} /></button>
        </div>

        {/* Title / Folder */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-card-foreground">Title</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 12 - Graphs"
              className="h-10 w-full rounded-lg border border-border bg-[var(--input-background)] px-3 text-[13.5px] placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(194,65,12,0.12)]"
            />
            <p className="mt-1 text-[10.5px] text-muted-foreground">미입력 시 파일명이 제목이 됩니다</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-card-foreground">Folder</label>
            {newFolderMode ? (
              <div className="flex gap-1.5">
                <input
                  autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newFolderName.trim()) {
                      const id = addFolder(newFolderName); if (id) setFolderId(id);
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
        </div>

        {/* 필수 드롭존 2종 */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Zone zone="pdf" icon={<FileText size={19} />} label="슬라이드 PDF / PPT" required />
          <Zone zone="audio" icon={<Mic size={19} />} label="녹음 파일" required />
        </div>

        {/* 선택: 사진 */}
        <div className="mt-4">
          <button
            onClick={() => inputRefs.photo.current?.click()}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-[#FBFAF8] px-3.5 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-accent/50"
          >
            <ImagePlus size={15} className="text-muted-foreground" />
            <div>
              <div className="text-[12.5px] font-medium text-foreground">+ 사진 추가 <span className="text-muted-foreground">(선택 · 여러 장) — 필기·판서 사진</span></div>
              <div className="text-[10.5px] text-muted-foreground">촬영 시각(EXIF) 기준으로 타임라인·노트에 자동 배치</div>
            </div>
          </button>
          <input ref={inputRefs.photo} type="file" hidden multiple accept=".jpg,.jpeg,.png,.heic" onChange={(e) => e.target.files && pick("photo", e.target.files)} />
          {errors.photo && <p className="mt-1.5 text-[11.5px] font-medium text-destructive">{errors.photo}</p>}
          {files.photo.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {files.photo.map((f) => (
                <span key={f.name} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-foreground">
                  {f.name}{uploading && ` · ${Math.round(f.progress)}%`}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 액션 */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-[13px] font-medium text-foreground hover:bg-secondary">Cancel</button>
          <button
            disabled={!canStart}
            onClick={() => setUploading(true)}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles size={14} /> {uploading ? `Uploading ${overall}%` : "Start analysis"}
          </button>
        </div>
        {disabledReason && !canStart && (
          <p className="mt-2 text-right text-[11.5px] text-muted-foreground">{disabledReason}</p>
        )}
        {uploading && (
          <p className="mt-2 text-right text-[11.5px] text-muted-foreground">업로드가 끝나면 자동으로 분석이 시작됩니다 · 남은 시간 ~{Math.max(1, Math.round((100 - overall) / 20))}0초</p>
        )}
      </div>
    </div>
  );
}
