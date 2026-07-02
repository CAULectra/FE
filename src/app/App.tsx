import { useState, useEffect, useRef, useCallback, type ReactNode, type MouseEvent as ReactMouseEvent } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./components/ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, ChevronRight, ArrowRight, Upload, FileText,
  Mic, Image as ImageIcon, Brain, Layers, BookOpen, Pencil,
  Plus, Clock, Search, Bell, FolderOpen,
  Check, ChevronLeft, X,
  MoreHorizontal, MessageSquare, Play,
  Star, CheckCircle,
  Activity, ListOrdered, Timer, Loader2,
  Bookmark, Pause, SkipBack, SkipForward, Languages, Send,
  type LucideIcon,
} from "lucide-react";
import { LectraLogo } from "./components/LectraLogo";

type Screen = "landing" | "login" | "dashboard" | "upload" | "analysis" | "study";

interface NavProps {
  navigate: (s: Screen) => void;
}

interface ProjectDraft {
  name: string;
  subject: string;
  description: string;
}

const EMPTY_DRAFT: ProjectDraft = { name: "", subject: "", description: "" };

// ─── DATA ────────────────────────────────────────────────────────────────────

const PROJECTS = [
  { id: "1", name: "1장 - 배열과 연결리스트", subject: "자료구조", files: 3, lastModified: "2시간 전", iconBg: "bg-blue-50", iconText: "text-blue-500", dot: "bg-blue-400" },
  { id: "2", name: "2장 - 스택과 큐", subject: "자료구조", files: 2, lastModified: "1일 전", iconBg: "bg-violet-50", iconText: "text-violet-500", dot: "bg-violet-400" },
  { id: "3", name: "3장 - 트리와 그래프", subject: "자료구조", files: 4, lastModified: "3일 전", iconBg: "bg-emerald-50", iconText: "text-emerald-500", dot: "bg-emerald-400" },
  { id: "4", name: "프로세스와 스레드", subject: "운영체제", files: 2, lastModified: "5일 전", iconBg: "bg-amber-50", iconText: "text-amber-500", dot: "bg-amber-400" },
  { id: "5", name: "메모리 관리", subject: "운영체제", files: 3, lastModified: "1주 전", iconBg: "bg-rose-50", iconText: "text-rose-500", dot: "bg-rose-400" },
  { id: "6", name: "정렬 알고리즘", subject: "알고리즘", files: 2, lastModified: "2주 전", iconBg: "bg-cyan-50", iconText: "text-cyan-500", dot: "bg-cyan-400" },
];

const FEATURES = [
  { icon: Layers, title: "멀티모달 통합 분석", desc: "강의 슬라이드, 음성, 판서를 하나의 AI가 함께 분석합니다. 각 자료를 별도로 처리하지 않고 통합된 맥락으로 이해합니다.", iconBg: "bg-blue-50", iconColor: "text-blue-500" },
  { icon: Brain, title: "AI 자동 학습 노트 생성", desc: "강의 내용을 구조화하여 보기 쉬운 노트를 자동 생성합니다. 핵심 개념, 요약, 중요 포인트를 명확히 정리합니다.", iconBg: "bg-violet-50", iconColor: "text-violet-500" },
  { icon: BookOpen, title: "챕터별 자동 분류", desc: "슬라이드를 AI가 분석하여 같은 주제를 하나의 챕터로 자동 묶습니다. Chapter 1 (1~4페이지), Chapter 2 (5~9페이지) 형태로 구조화됩니다.", iconBg: "bg-emerald-50", iconColor: "text-emerald-500" },
  { icon: Pencil, title: "판서 및 보충설명 반영", desc: "슬라이드에 없는 교수님의 보충 설명까지 함께 정리합니다. 녹음과 판서를 통해 강의의 모든 내용을 놓치지 않습니다.", iconBg: "bg-amber-50", iconColor: "text-amber-500" },
];

const HOW_STEPS = [
  { icon: Upload, label: "업로드", desc: "슬라이드·녹음·판서를 한 번에 업로드합니다" },
  { icon: Brain, label: "AI 처리", desc: "AI가 모든 자료를 통합 분석합니다" },
  { icon: Layers, label: "정렬 및 통합", desc: "챕터별로 자동 분류·정리합니다" },
  { icon: FileText, label: "강의 노트 생성", desc: "완성도 높은 학습 노트를 생성합니다" },
  { icon: MessageSquare, label: "질문하기", desc: "AI에게 강의 내용을 질문하세요" },
];

// ─── WORKSPACE JOBS (실시간 분석 진행) ─────────────────────────────────────────

type JobStatus = "processing" | "queued" | "completed";

interface Job {
  id: string;
  title: string;
  week?: string;
  progress: number;      // 0 ~ 100
  slides: number;
  audioMin: number;
  whiteboard: number;    // 판서 이미지 장수
  hasPdf: boolean;
  hasAudio: boolean;
  status: JobStatus;
  speed: number;         // 초당 진행률(%)
  createdAt: number;     // ms timestamp
}

const MAX_CONCURRENT = 2;
const JOB_STEPS = ["PDF 분석", "Speech-to-Text", "판서 이미지 분석", "RAG 인덱싱", "노트 생성"];

function stepForProgress(p: number) {
  if (p >= 100) return "완료";
  const idx = Math.min(JOB_STEPS.length - 1, Math.floor(p / (100 / JOB_STEPS.length)));
  return JOB_STEPS[idx];
}
function etaMinutes(p: number) {
  return Math.max(1, Math.round((100 - p) / 8));
}
function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "방금 전";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  return `${Math.floor(m / 60)}시간 전`;
}

function makeInitialJobs(): Job[] {
  const now = Date.now();
  const min = 60 * 1000;
  return [
    { id: "j1", title: "Computer Architecture", week: "Week 7", progress: 48, slides: 32, audioMin: 48, whiteboard: 3, hasPdf: true, hasAudio: true, status: "processing", speed: 0.7, createdAt: now - 3 * min },
    { id: "j2", title: "Operating Systems", week: "Week 5", progress: 94, slides: 26, audioMin: 52, whiteboard: 2, hasPdf: true, hasAudio: true, status: "processing", speed: 0.7, createdAt: now - 12 * min },
    { id: "j3", title: "Linear Algebra", week: "Week 9", progress: 0, slides: 20, audioMin: 40, whiteboard: 0, hasPdf: true, hasAudio: true, status: "queued", speed: 0.7, createdAt: now - 2 * min },
    { id: "j4", title: "Discrete Math", week: "Week 6", progress: 0, slides: 18, audioMin: 35, whiteboard: 1, hasPdf: true, hasAudio: false, status: "queued", speed: 0.7, createdAt: now - min },
    // 오늘 완료된 작업
    { id: "c1", title: "확률및통계", week: "Week 8", progress: 100, slides: 30, audioMin: 50, whiteboard: 2, hasPdf: true, hasAudio: true, status: "completed", speed: 0.7, createdAt: now - 40 * min },
    { id: "c2", title: "자료구조", week: "Week 6", progress: 100, slides: 28, audioMin: 46, whiteboard: 1, hasPdf: true, hasAudio: true, status: "completed", speed: 0.7, createdAt: now - 55 * min },
    { id: "c3", title: "알고리즘", week: "Week 5", progress: 100, slides: 24, audioMin: 38, whiteboard: 0, hasPdf: true, hasAudio: true, status: "completed", speed: 0.7, createdAt: now - 90 * min },
    { id: "c4", title: "데이터베이스", week: "Week 7", progress: 100, slides: 34, audioMin: 55, whiteboard: 3, hasPdf: true, hasAudio: true, status: "completed", speed: 0.7, createdAt: now - 120 * min },
    { id: "c5", title: "네트워크", week: "Week 4", progress: 100, slides: 22, audioMin: 42, whiteboard: 1, hasPdf: true, hasAudio: false, status: "completed", speed: 0.7, createdAt: now - 150 * min },
    { id: "c6", title: "컴파일러", week: "Week 3", progress: 100, slides: 26, audioMin: 48, whiteboard: 2, hasPdf: true, hasAudio: true, status: "completed", speed: 0.7, createdAt: now - 180 * min },
  ];
}

function StatCard({ label, value, Icon, iconColor, onClick, active }: { label: string; value: string | number; Icon: LucideIcon; iconColor: string; onClick?: () => void; active?: boolean }) {
  return (
    <div onClick={onClick}
      className={`bg-white rounded-2xl border p-5 transition-all ${onClick ? "cursor-pointer hover:shadow-md hover:shadow-primary/5" : ""} ${active ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="text-3xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
    </div>
  );
}

function InfoBox({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function SourceBadge({ Icon, label }: { Icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
      <Icon className="w-3 h-3" /> {label} <Check className="w-3 h-3" />
    </span>
  );
}

function JobCard({ job, onCancel, onOpen, onView }: { job: Job; onCancel: (id: string) => void; onOpen: () => void; onView: (id: string) => void }) {
  const done = job.progress >= 100;
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base truncate">{job.title}</h3>
            {job.week && <span className="text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground font-medium flex-shrink-0">{job.week}</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">업로드 {timeAgo(job.createdAt)}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${done ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary"}`}>
          {done ? <Check className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
          {done ? "완료" : "분석 중"}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">전체 진행률</span>
          <span className="text-sm font-bold">{Math.round(job.progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${job.progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <InfoBox Icon={Sparkles} label="현재 단계" value={done ? "완료" : stepForProgress(job.progress)} />
        <InfoBox Icon={Clock} label="남은 시간" value={done ? "0분" : `${etaMinutes(job.progress)}분`} />
        <InfoBox Icon={FileText} label="슬라이드" value={`${job.slides}`} />
        <InfoBox Icon={Mic} label="오디오" value={`${job.audioMin}분`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {job.hasPdf && <SourceBadge Icon={FileText} label="PDF" />}
          {job.hasAudio && <SourceBadge Icon={Mic} label="오디오" />}
          {job.whiteboard > 0 && <SourceBadge Icon={ImageIcon} label={`판서 · ${job.whiteboard}장`} />}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onCancel(job.id)}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5" /> 취소
          </button>
          <button onClick={done ? onOpen : () => onView(job.id)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            {done ? "열기" : "분석 화면"} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function QueuedCard({ job, onCancel }: { job: Job; onCancel: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{job.title}</h3>
          {job.week && <span className="text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground flex-shrink-0">{job.week}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">대기 중 · 업로드 {timeAgo(job.createdAt)}</p>
      </div>
      <span className="text-xs font-medium px-2.5 py-1 bg-muted rounded-full text-muted-foreground flex-shrink-0">대기 중</span>
      <button onClick={() => onCancel(job.id)} className="p-1.5 rounded-md hover:bg-muted transition-colors flex-shrink-0">
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}

function CompletedCard({ job, onOpen }: { job: Job; onOpen: () => void }) {
  return (
    <button onClick={onOpen}
      className="w-full text-left bg-white rounded-xl border border-border p-4 flex items-center gap-3 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all">
      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-4 h-4 text-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{job.title}</h3>
          {job.week && <span className="text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground flex-shrink-0">{job.week}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> 슬라이드 {job.slides}</span>
          ·
          <span className="inline-flex items-center gap-1"><Mic className="w-3 h-3" /> {job.audioMin}분</span>
          ·
          <span>완료 {timeAgo(job.createdAt)}</span>
        </p>
      </div>
      <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full flex-shrink-0">
        <Check className="w-3 h-3" /> 완료
      </span>
      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

function WorkspaceView({ jobs, onNewLecture, onCancel, onOpen, onView }: {
  jobs: Job[];
  onNewLecture: () => void;
  onCancel: (id: string) => void;
  onOpen: () => void;
  onView: (id: string) => void;
}) {
  const [view, setView] = useState<"active" | "completed">("active");
  const processing = jobs.filter(j => j.status === "processing");
  const queued = jobs.filter(j => j.status === "queued");
  const completed = jobs.filter(j => j.status === "completed");
  const completedToday = completed.length;

  return (
    <motion.div key="workspace" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
      <div className="px-7 py-7 max-w-6xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary">{processing.length}개 작업 진행 중</span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>워크스페이스</h1>
            <p className="text-sm text-muted-foreground">모든 AI 분석 작업을 한 곳에서 실시간으로 확인하세요.</p>
          </div>
          <button onClick={onNewLecture}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/25 flex-shrink-0">
            <Plus className="w-4 h-4" /> 새 강의
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="분석 중" value={processing.length} Icon={Activity} iconColor="text-primary"
            onClick={() => setView("active")} active={view === "active"} />
          <StatCard label="대기 중" value={queued.length} Icon={ListOrdered} iconColor="text-muted-foreground"
            onClick={() => setView("active")} active={false} />
          <StatCard label="오늘 완료" value={completedToday} Icon={CheckCircle} iconColor="text-emerald-500"
            onClick={() => setView("completed")} active={view === "completed"} />
          <StatCard label="평균 처리 시간" value="6분" Icon={Timer} iconColor="text-muted-foreground" />
        </div>

        {view === "active" ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>분석 중</h2>
              <span className="text-sm text-muted-foreground font-medium">{processing.length}</span>
            </div>

            {processing.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-border p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-sm font-medium mb-1">진행 중인 작업이 없습니다</p>
                <p className="text-xs text-muted-foreground mb-4">새 강의를 업로드하면 여기에서 분석 진행 상황을 확인할 수 있습니다.</p>
                {completedToday > 0 && (
                  <button onClick={() => setView("completed")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> 오늘 완료된 {completedToday}개 보기
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {processing.map(job => <JobCard key={job.id} job={job} onCancel={onCancel} onOpen={onOpen} onView={onView} />)}
              </div>
            )}

            {queued.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-10 mb-4">
                  <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>대기 중</h2>
                  <span className="text-sm text-muted-foreground font-medium">{queued.length}</span>
                </div>
                <div className="space-y-3">
                  {queued.map(job => <QueuedCard key={job.id} job={job} onCancel={onCancel} />)}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>오늘 완료</h2>
                <span className="text-sm text-muted-foreground font-medium">{completed.length}</span>
              </div>
              <button onClick={() => setView("active")}
                className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> 진행 중 작업으로
              </button>
            </div>

            {completed.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-border p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">오늘 완료된 작업이 없습니다</p>
                <p className="text-xs text-muted-foreground">분석이 완료되면 여기에서 결과 노트를 열어볼 수 있습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completed.map(job => <CompletedCard key={job.id} job={job} onOpen={onOpen} />)}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

function HeroPreview() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 3), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative select-none">
      <div className="bg-white rounded-2xl border border-border/60 shadow-2xl shadow-blue-100/60 p-5 overflow-hidden" style={{ minHeight: 260 }}>
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <div className="flex-1 h-5 bg-muted rounded ml-2" />
        </div>

        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs font-medium text-muted-foreground mb-3">자료 업로드</p>
              {[
                { icon: FileText, label: "강의슬라이드.pdf", bg: "bg-blue-50", color: "text-blue-500" },
                { icon: Mic, label: "강의녹음.mp3", bg: "bg-violet-50", color: "text-violet-500" },
                { icon: ImageIcon, label: "판서사진.jpg", bg: "bg-emerald-50", color: "text-emerald-500" },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl ${f.bg} mb-2`}>
                    <Icon className={`w-3.5 h-3.5 ${f.color}`} />
                    <span className="text-xs font-medium text-foreground">{f.label}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {phase === 1 && (
            <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-2">
              <p className="text-xs font-medium text-muted-foreground mb-4">AI 분석 중...</p>
              <div className="flex justify-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
              </div>
              {["PDF 분석 완료", "STT 변환 중...", "노트 생성 대기"].map((s, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${i === 0 ? "bg-emerald-100" : i === 1 ? "bg-primary/10" : "bg-muted"}`}>
                    {i === 0 && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                    {i === 1 && (
                      <motion.div className="w-2 h-2 rounded-full border border-primary border-t-transparent"
                        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{s}</span>
                </div>
              ))}
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: "48%" }} transition={{ duration: 2 }} />
              </div>
            </motion.div>
          )}

          {phase === 2 && (
            <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs font-medium text-muted-foreground mb-2">AI 학습 노트</p>
              <p className="text-sm font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Chapter 1: 배열과 연결리스트</p>
              <div className="space-y-1.5 mb-3">
                <div className="h-2 bg-muted rounded-full w-full" />
                <div className="h-2 bg-muted rounded-full w-4/5" />
                <div className="h-2 bg-primary/20 rounded-full w-2/3" />
                <div className="h-2 bg-muted rounded-full w-full" />
                <div className="h-2 bg-muted rounded-full w-3/4" />
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg border-l-2 border-primary">
                <div className="h-1.5 bg-primary/20 rounded-full w-3/4 mb-1.5" />
                <div className="h-1.5 bg-primary/20 rounded-full w-1/2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
        className="absolute -top-3 -right-4 bg-white rounded-xl shadow-lg border border-border px-3 py-2 flex items-center gap-2">
        <div className="w-5 h-5 bg-emerald-100 rounded-md flex items-center justify-center">
          <Check className="w-3 h-3 text-emerald-600" />
        </div>
        <span className="text-xs font-medium">노트 생성 완료!</span>
      </motion.div>

      <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity }}
        className="absolute -bottom-3 -left-4 bg-white rounded-xl shadow-lg border border-border px-3 py-2 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">AI 분석 완료</span>
      </motion.div>
    </div>
  );
}

function LandingPage({ navigate }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % 5), 1700);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md border-b border-border shadow-sm" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <LectraLogo className="block" />
          <div className="hidden md:flex items-center gap-8">
            {["기능", "사용 방법", "요금제"].map(item => (
              <a key={item} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <button onClick={() => navigate("login")}
              className="text-muted-foreground hover:text-foreground transition-colors">
              회원가입
            </button>
            <span className="text-border">|</span>
            <button onClick={() => navigate("login")}
              className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/25">
              로그인
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-to-b from-blue-50/90 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-32 right-10 w-72 h-72 bg-violet-50/50 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-56 h-56 bg-cyan-50/50 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
            <defs>
              <pattern id="grid" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#2563EB" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-600 mb-6">
              <Sparkles className="w-3 h-3" />
              멀티모달 AI 학습 노트 자동 생성
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-5xl font-bold leading-tight mb-5 text-foreground"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              더 스마트한<br />
              <span className="text-primary">학습</span>을 시작하세요
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground leading-relaxed mb-8">
              슬라이드, 녹음, 판서를 한 번에 분석하여<br />
              AI가 완성된 학습 노트를 생성합니다.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex items-center gap-3">
              <button onClick={() => navigate("login")}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2">
                지금 시작하기 <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate("dashboard")}
                className="px-6 py-3 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-all flex items-center gap-2">
                <Play className="w-4 h-4" /> 서비스 둘러보기
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="flex items-center gap-8 mt-10 pt-8 border-t border-border">
              {[{ val: "70%", label: "학습 시간 단축" }, { val: "98%", label: "노트 정확도" }, { val: "2만+", label: "활성 사용자" }].map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="hidden lg:block">
            <HeroPreview />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>어떻게 작동하나요?</h2>
            <p className="text-muted-foreground text-sm">6단계로 완성되는 AI 학습 노트</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {HOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === i;
              return (
                <motion.div key={i}
                  animate={{ y: isActive ? -6 : 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setActiveStep(i)}
                  className={`cursor-pointer rounded-2xl p-6 border transition-all duration-300 flex flex-col items-center text-center w-44 ${isActive ? "bg-white border-primary/20 shadow-xl shadow-primary/10" : "bg-white border-border hover:border-primary/20 hover:shadow-md"}`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${isActive ? "bg-primary shadow-lg shadow-primary/30" : "bg-primary/80"}`}>
                    <Icon className="text-white" style={{ width: 26, height: 26 }} />
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">{i + 1}. {step.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">{step.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>핵심 기능</h2>
            <p className="text-muted-foreground text-sm">Lectra만의 차별화된 기능을 경험하세요</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="group bg-white rounded-2xl p-7 border border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all">
                  <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4 text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          더 스마트하게 공부할 준비가 됐나요?
        </h2>
        <p className="text-muted-foreground text-base mb-8">
          첫 번째 강의를 업로드하면 몇 분 안에 구조화된 노트를 받을 수 있습니다.
        </p>
        <button onClick={() => navigate("login")}
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 text-sm">
          무료로 시작하기 <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <LectraLogo compact />
          <p className="text-xs text-muted-foreground">© 2025 Lectra. All rights reserved.</p>
        </div>
      </footer>
    </motion.div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────

function LoginPage({ navigate }: NavProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-50/70 via-background to-violet-50/40 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate("landing")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> 돌아가기
        </button>

        <div className="bg-white rounded-2xl border border-border shadow-xl shadow-blue-100/40 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-fit">
              <LectraLogo compact />
            </div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Lectra에 오신 것을 환영합니다
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">AI 학습 노트 자동 생성 플랫폼</p>
          </div>

          <button onClick={() => navigate("dashboard")}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-xl hover:bg-muted/50 transition-all text-sm font-medium mb-4">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107" />
              <path d="M6.306,14.691l6.571,4.819C14.655,15.108,19.001,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00" />
              <path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50" />
              <path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2" />
            </svg>
            Google로 계속하기
          </button>

          <p className="text-[11px] text-muted-foreground text-center mt-5 leading-relaxed">
            계속 진행하면 Lectra의{" "}
            <a href="#" className="underline hover:text-foreground">이용약관</a>과{" "}
            <a href="#" className="underline hover:text-foreground">개인정보처리방침</a>에 동의하는 것입니다.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

const FOLDER_META: Record<string, { iconBg: string; iconText: string; dot: string }> = {
  "자료구조": { iconBg: "bg-blue-50", iconText: "text-blue-500", dot: "bg-blue-400" },
  "운영체제": { iconBg: "bg-amber-50", iconText: "text-amber-500", dot: "bg-amber-400" },
  "알고리즘": { iconBg: "bg-cyan-50", iconText: "text-cyan-500", dot: "bg-cyan-400" },
};

interface NewFolderModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  existingFolders: string[];
}

function NewFolderModal({ open, onClose, onCreate, existingFolders }: NewFolderModalProps) {
  const [name, setName] = useState("");

  // 모달이 열릴 때마다 입력값 초기화
  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const trimmed = name.trim();
  const isDuplicate = existingFolders.some(f => f === trimmed);
  const canCreate = trimmed.length > 0 && !isDuplicate;

  const submit = () => {
    if (!canCreate) return;
    onCreate(trimmed);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md bg-white rounded-2xl border border-border shadow-2xl shadow-slate-900/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-3 px-6 pt-6 pb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>새 폴더 만들기</h2>
                <p className="text-xs text-muted-foreground mt-0.5">과목이나 주제별로 노트를 정리할 폴더를 만들어보세요.</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-2">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                폴더 이름 <span className="text-primary">*</span>
              </label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="예: 확률및통계"
                className="w-full px-3.5 py-2.5 text-sm bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 focus:bg-white transition-all"
              />
              {isDuplicate && (
                <p className="text-xs text-destructive mt-1.5">이미 존재하는 폴더 이름입니다.</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 mt-4 border-t border-border bg-muted/20">
              <button onClick={onClose}
                className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                취소
              </button>
              <button onClick={submit} disabled={!canCreate}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> 폴더 만들기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 굿노트처럼 "+" 를 누르면 새 프로젝트 / 새 폴더를 고르는 메뉴
function CreateMenu({ children, onNewProject, onNewFolder, align = "start" }: {
  children: ReactNode;
  onNewProject: () => void;
  onNewFolder: () => void;
  align?: "start" | "center" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={6} className="w-56 p-1.5">
        <DropdownMenuItem onSelect={onNewProject} className="gap-2.5 py-2 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">새 프로젝트</div>
            <div className="text-xs text-muted-foreground">PDF·녹음·판서 업로드</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onNewFolder} className="gap-2.5 py-2 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">새 폴더</div>
            <div className="text-xs text-muted-foreground">노트를 정리할 폴더</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type DashTab = "lectures" | "workspace" | "favorites";

// 카드 우측 상단 즐겨찾기(북마크) 토글
function FavoriteButton({ active, onClick }: { active: boolean; onClick: (e: ReactMouseEvent) => void }) {
  return (
    <button onClick={onClick}
      title={active ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      className={`p-1 rounded-md hover:bg-muted transition-all ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
      <Star className={`w-4 h-4 transition-colors ${active ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
    </button>
  );
}

function DashboardPage({ navigate, setProjectDraft, jobs, cancelJob, activeTab, setActiveTab, onViewAnalysis }: NavProps & {
  setProjectDraft: (d: ProjectDraft) => void;
  jobs: Job[];
  cancelJob: (id: string) => void;
  activeTab: DashTab;
  setActiveTab: (t: DashTab) => void;
  onViewAnalysis: (id: string) => void;
}) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [extraFolders, setExtraFolders] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const subjects = [...new Set(PROJECTS.map(p => p.subject)), ...extraFolders];
  const folderProjects = selectedFolder ? PROJECTS.filter(p => p.subject === selectedFolder) : [];

  // 즐겨찾기 토글 (폴더: "folder:과목", 프로젝트: "project:id")
  const toggleFavorite = (key: string) => (e: ReactMouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const favoriteFolders = subjects.filter(s => favorites.has(`folder:${s}`));
  const favoriteProjects = PROJECTS.filter(p => favorites.has(`project:${p.id}`));
  const hasFavorites = favoriteFolders.length + favoriteProjects.length > 0;

  // 새 폴더 생성 → 목록에 추가하고 바로 해당 폴더를 연다
  const createFolder = (name: string) => {
    setExtraFolders(prev => (prev.includes(name) ? prev : [...prev, name]));
    setShowNewFolder(false);
    setSelectedFolder(name);
  };

  // 새 프로젝트(노트) 생성 → 업로드 화면으로 이동 (현재 폴더를 과목으로 전달)
  const startNewProject = (subject: string | null) => {
    setProjectDraft({ name: "", subject: subject ?? "", description: "" });
    navigate("upload");
  };

  const Sidebar = () => (
    <aside className="w-56 border-r border-border bg-white flex flex-col flex-shrink-0">
      <div className="px-4 py-4 border-b border-border flex items-center gap-2">
        <LectraLogo compact className="block" />
      </div>
      <nav className="p-2 flex-1 space-y-0.5">
        {[
          { key: "lectures" as const, icon: BookOpen, label: "내 강의" },
          { key: "upload" as const, icon: Upload, label: "업로드" },
          { key: "workspace" as const, icon: Layers, label: "워크스페이스" },
          { key: "favorites" as const, icon: Star, label: "즐겨찾기" },
        ].map(item => {
          const Icon = item.icon;
          const isActive = item.key !== "upload" && activeTab === item.key;
          return (
            <button key={item.key}
              onClick={() => {
                if (item.key === "upload") { startNewProject(selectedFolder); return; }
                setActiveTab(item.key);
                if (item.key === "lectures") setSelectedFolder(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              <Icon className="w-4 h-4" /> {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">K</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">김학생</div>
            <div className="text-xs text-muted-foreground truncate">student@univ.ac.kr</div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ── 폴더 목록 (내 강의) ── */}
          {activeTab === "lectures" && !selectedFolder && (
            <motion.div key="folders" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-7 py-3.5 flex items-center justify-between">
                <h1 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>내 강의</h1>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input className="pl-9 pr-4 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 w-48" placeholder="폴더 검색..." />
                  </div>
                  <CreateMenu align="end"
                    onNewProject={() => startNewProject(null)}
                    onNewFolder={() => setShowNewFolder(true)}>
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                      <Plus className="w-4 h-4" /> 새로 만들기
                    </button>
                  </CreateMenu>
                </div>
              </div>

              <div className="px-7 py-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 신규 생성 카드 (새 프로젝트 / 새 폴더 선택) */}
                  <CreateMenu align="start"
                    onNewProject={() => startNewProject(null)}
                    onNewFolder={() => setShowNewFolder(true)}>
                    <button
                      className="group min-h-[150px] w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 transition-all cursor-pointer">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-primary">새로 만들기</span>
                      <span className="text-xs text-muted-foreground">프로젝트 · 폴더</span>
                    </button>
                  </CreateMenu>

                  {subjects.map(subject => {
                    const meta = FOLDER_META[subject] ?? { iconBg: "bg-slate-50", iconText: "text-slate-500", dot: "bg-slate-400" };
                    const count = PROJECTS.filter(p => p.subject === subject).length;
                    const latest = PROJECTS.filter(p => p.subject === subject)[0];
                    const lastModified = latest ? latest.lastModified : "방금 전";
                    return (
                      <motion.div key={subject} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
                        onClick={() => setSelectedFolder(subject)}
                        className="group bg-white rounded-xl border border-border hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 p-5 cursor-pointer transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-11 h-11 rounded-xl ${meta.iconBg} flex items-center justify-center`}>
                            <FolderOpen className={`w-5 h-5 ${meta.iconText}`} />
                          </div>
                          <div className="flex items-center gap-0.5">
                            <FavoriteButton active={favorites.has(`folder:${subject}`)} onClick={toggleFavorite(`folder:${subject}`)} />
                            <button className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted transition-all"
                              onClick={e => e.stopPropagation()}>
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-bold text-sm mb-1">{subject}</h3>
                        <p className="text-xs text-muted-foreground mb-4">노트 {count}개</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {count}개 파일
                          </span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lastModified}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 폴더 내 파일 목록 ── */}
          {activeTab === "lectures" && selectedFolder && (
            <motion.div key="files" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-7 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedFolder(null)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <span className="text-muted-foreground text-sm">내 강의</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <h1 className="font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{selectedFolder}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input className="pl-9 pr-4 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 w-48" placeholder="노트 검색..." />
                  </div>
                  <CreateMenu align="end"
                    onNewProject={() => startNewProject(selectedFolder)}
                    onNewFolder={() => setShowNewFolder(true)}>
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                      <Plus className="w-4 h-4" /> 새로 만들기
                    </button>
                  </CreateMenu>
                </div>
              </div>

              <div className="px-7 py-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 신규 생성 카드 (새 프로젝트 / 새 폴더 선택) */}
                  <CreateMenu align="start"
                    onNewProject={() => startNewProject(selectedFolder)}
                    onNewFolder={() => setShowNewFolder(true)}>
                    <button
                      className="group min-h-[164px] w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 transition-all cursor-pointer">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-primary">새로 만들기</span>
                      <span className="text-xs text-muted-foreground">프로젝트 · 폴더</span>
                    </button>
                  </CreateMenu>

                  {folderProjects.map(project => (
                    <motion.div key={project.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
                      onClick={() => navigate("study")}
                      className="group bg-white rounded-xl border border-border hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 p-5 cursor-pointer transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-9 h-9 rounded-xl ${project.iconBg} flex items-center justify-center`}>
                          <FileText style={{ width: 18, height: 18 }} className={project.iconText} />
                        </div>
                        <div className="flex items-center gap-0.5">
                          <FavoriteButton active={favorites.has(`project:${project.id}`)} onClick={toggleFavorite(`project:${project.id}`)} />
                          <button className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted transition-all"
                            onClick={e => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 leading-snug">{project.name}</h3>
                      <p className="text-xs text-muted-foreground mb-4">{project.subject}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> 파일 {project.files}개</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {project.lastModified}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 워크스페이스 (실시간 분석 진행) ── */}
          {activeTab === "workspace" && (
            <WorkspaceView
              jobs={jobs}
              onNewLecture={() => startNewProject(null)}
              onCancel={cancelJob}
              onOpen={() => navigate("study")}
              onView={onViewAnalysis}
            />
          )}

          {/* ── 즐겨찾기 ── */}
          {activeTab === "favorites" && (
            <motion.div key="favorites" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-7 py-3.5 flex items-center">
                <h1 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>즐겨찾기</h1>
              </div>

              {!hasFavorites ? (
                <div className="flex flex-col items-center justify-center text-center px-6 py-24">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
                    <Star className="w-8 h-8 text-amber-400" />
                  </div>
                  <h2 className="font-bold text-base mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>즐겨찾기한 항목이 없습니다</h2>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                    폴더나 노트 카드 우측 상단의 별 아이콘을 눌러 자주 보는 항목을 추가해보세요.
                  </p>
                </div>
              ) : (
                <div className="px-7 py-6 space-y-8">
                  {favoriteFolders.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">폴더</h2>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteFolders.map(subject => {
                          const meta = FOLDER_META[subject] ?? { iconBg: "bg-slate-50", iconText: "text-slate-500", dot: "bg-slate-400" };
                          const count = PROJECTS.filter(p => p.subject === subject).length;
                          return (
                            <motion.div key={subject} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
                              onClick={() => { setActiveTab("lectures"); setSelectedFolder(subject); }}
                              className="group bg-white rounded-xl border border-border hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 p-5 cursor-pointer transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div className={`w-11 h-11 rounded-xl ${meta.iconBg} flex items-center justify-center`}>
                                  <FolderOpen className={`w-5 h-5 ${meta.iconText}`} />
                                </div>
                                <FavoriteButton active onClick={toggleFavorite(`folder:${subject}`)} />
                              </div>
                              <h3 className="font-bold text-sm mb-1">{subject}</h3>
                              <p className="text-xs text-muted-foreground">노트 {count}개</p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {favoriteProjects.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">노트</h2>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteProjects.map(project => (
                          <motion.div key={project.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
                            onClick={() => navigate("study")}
                            className="group bg-white rounded-xl border border-border hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 p-5 cursor-pointer transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-9 h-9 rounded-xl ${project.iconBg} flex items-center justify-center`}>
                                <FileText style={{ width: 18, height: 18 }} className={project.iconText} />
                              </div>
                              <FavoriteButton active onClick={toggleFavorite(`project:${project.id}`)} />
                            </div>
                            <h3 className="font-semibold text-sm mb-1 leading-snug">{project.name}</h3>
                            <p className="text-xs text-muted-foreground mb-4">{project.subject}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> 파일 {project.files}개</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {project.lastModified}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <NewFolderModal
        open={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        onCreate={createFolder}
        existingFolders={subjects}
      />
    </motion.div>
  );
}

// ─── UPLOAD PAGE ──────────────────────────────────────────────────────────────

function UploadPage({ navigate, projectDraft, onAnalyze }: NavProps & {
  projectDraft: ProjectDraft;
  onAnalyze: (partial: Partial<Job>) => void;
}) {
  const [files, setFiles] = useState<{ pdf: string[]; audio: string[]; image: string[] }>({
    pdf: ["강의슬라이드_1주차.pdf"],
    audio: [],
    image: ["칠판사진_01.jpg"],
  });
  const [dragOver, setDragOver] = useState<string | null>(null);

  const zones = [
    { key: "pdf" as const, icon: FileText, label: "PDF 강의 슬라이드", desc: "PDF 형식의 강의 자료", iconBg: "bg-blue-50", iconColor: "text-blue-500", borderActive: "border-blue-300 bg-blue-50/60", btnColor: "text-blue-500" },
    { key: "audio" as const, icon: Mic, label: "강의 녹음 파일", desc: "mp3, wav, m4a 형식", iconBg: "bg-violet-50", iconColor: "text-violet-500", borderActive: "border-violet-300 bg-violet-50/60", btnColor: "text-violet-500" },
    { key: "image" as const, icon: ImageIcon, label: "판서 이미지", desc: "jpg, png 형식", iconBg: "bg-emerald-50", iconColor: "text-emerald-500", borderActive: "border-emerald-300 bg-emerald-50/60", btnColor: "text-emerald-500" },
  ];

  const totalFiles = Object.values(files).flat().length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      <header className="border-b border-border bg-white px-6 py-3.5 flex items-center gap-3">
        <button onClick={() => navigate("dashboard")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4.5 h-4.5 text-muted-foreground" style={{ width: 18, height: 18 }} />
        </button>
        <LectraLogo compact className="block" />
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        {projectDraft.subject && (
          <>
            <span className="text-sm text-muted-foreground">{projectDraft.subject}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </>
        )}
        <span className="text-sm font-medium text-foreground">새 프로젝트 만들기</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          {projectDraft.subject && (
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                <FolderOpen className="w-3 h-3" /> {projectDraft.subject}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>강의 자료 업로드</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            AI가 분석할 강의 자료를 업로드해 주세요. 슬라이드, 녹음, 판서 이미지를 모두 업로드하면 가장 완성도 높은 학습 노트가 생성됩니다.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {zones.map(zone => {
            const Icon = zone.icon;
            const zoneFiles = files[zone.key];
            const isOver = dragOver === zone.key;
            return (
              <div key={zone.key}>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(zone.key); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); setDragOver(null); }}
                  className={`rounded-xl border-2 border-dashed p-5 transition-all cursor-pointer ${isOver ? zone.borderActive : "border-border hover:border-primary/30 hover:bg-white"}`}>
                  <div className={`w-10 h-10 ${zone.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${zone.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{zone.label}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{zone.desc}</p>
                  <button className={`text-xs font-medium ${zone.btnColor} flex items-center gap-1 hover:underline`}>
                    <Upload className="w-3 h-3" /> 파일 선택
                  </button>
                </div>

                {zoneFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {zoneFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-border text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="truncate flex-1 text-foreground">{f}</span>
                        <button onClick={() => setFiles(prev => ({ ...prev, [zone.key]: prev[zone.key].filter((_, fi) => fi !== i) }))}
                          className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">총 {totalFiles}개 파일 업로드됨</p>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("dashboard")}
              className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
              취소
            </button>
            <button
              onClick={() => {
                onAnalyze({
                  title: projectDraft.name || projectDraft.subject || "새 강의",
                  slides: files.pdf.length > 0 ? 24 : 0,
                  audioMin: files.audio.length > 0 ? 45 : 0,
                  whiteboard: files.image.length,
                  hasPdf: files.pdf.length > 0,
                  hasAudio: files.audio.length > 0,
                });
              }}
              disabled={totalFiles === 0}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI 분석 시작
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ANALYSIS PAGE (원형 다이어그램) ───────────────────────────────────────────

interface AnalysisStage {
  label: string;
  sub: string;
  Icon: LucideIcon;
}

const ANALYSIS_STAGES: AnalysisStage[] = [
  { label: "PDF 분석", sub: "슬라이드 텍스트·구조 추출 중", Icon: FileText },
  { label: "음성 STT", sub: "녹음 음성을 텍스트로 변환 중", Icon: Mic },
  { label: "판서 분석", sub: "판서 이미지를 인식하는 중", Icon: ImageIcon },
  { label: "RAG 인덱싱", sub: "검색용 벡터 인덱스 구성 중", Icon: Layers },
  { label: "노트 생성", sub: "구조화된 학습 노트 작성 중", Icon: Sparkles },
];

// viewBox 0 0 100 100 기준. 각도 0° = 12시 방향, 시계방향 증가.
function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [50 + r * Math.sin(a), 50 - r * Math.cos(a)];
}
function donutSegment(rInner: number, rOuter: number, start: number, end: number) {
  const [xo1, yo1] = polar(rOuter, start);
  const [xo2, yo2] = polar(rOuter, end);
  const [xi2, yi2] = polar(rInner, end);
  const [xi1, yi1] = polar(rInner, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${xo1} ${yo1} A ${rOuter} ${rOuter} 0 ${large} 1 ${xo2} ${yo2} L ${xi2} ${yi2} A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1} Z`;
}

type StageState = "done" | "active" | "pending";

function AnalysisPage({ navigate, job, goToWorkspace }: NavProps & {
  job?: Job;
  goToWorkspace: () => void;
}) {
  const progress = job ? job.progress : 0;
  const done = progress >= 100;
  const N = ANALYSIS_STAGES.length;
  const stageIndex = done ? N : Math.min(N - 1, Math.floor(progress / (100 / N)));
  const seg = 360 / N;
  const gap = 3.5; // 세그먼트 사이 각도 간격

  const stateOf = (i: number): StageState =>
    done || i < stageIndex ? "done" : i === stageIndex ? "active" : "pending";
  const fillOf = (s: StageState) =>
    s === "done" ? "#93C5FD" : s === "active" ? "#2563EB" : "#E7ECF3";

  const current = ANALYSIS_STAGES[Math.min(stageIndex, N - 1)];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen bg-background flex flex-col">
      {/* Header — 언제든 다른 화면으로 이동 가능 */}
      <header className="border-b border-border bg-white px-6 py-3.5 flex items-center gap-3">
        <button onClick={() => navigate("dashboard")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="text-muted-foreground" style={{ width: 18, height: 18 }} />
        </button>
        <LectraLogo compact className="block" />
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground truncate">{job?.title ?? "AI 분석"}</span>
        {job?.week && <span className="text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground flex-shrink-0">{job.week}</span>}
        <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`w-1.5 h-1.5 rounded-full ${done ? "bg-emerald-500" : "bg-primary animate-pulse"}`} />
          {done ? "분석 완료" : "백그라운드에서 계속 진행됩니다"}
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-4">
          {done
            ? <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-xs font-semibold text-emerald-600">분석이 완료되었습니다</span></>
            : <><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /><span className="text-xs font-semibold text-primary">{N}단계 멀티모달 통합 분석 중</span></>}
        </div>
        <h1 className="text-2xl font-bold mb-1.5 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {job?.title ?? "강의 분석"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          강의 슬라이드·음성·판서를 하나의 AI가 통합 분석합니다.
        </p>

        {/* 원형 다이어그램 */}
        <div className="relative my-2" style={{ width: "min(88vw, 380px)", aspectRatio: "1 / 1" }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {ANALYSIS_STAGES.map((_, i) => {
              const start = i * seg + gap / 2;
              const end = (i + 1) * seg - gap / 2;
              const state = stateOf(i);
              return (
                <g key={i}>
                  <path d={donutSegment(30, 47, start, end)} fill={fillOf(state)} />
                  {state === "active" && (
                    <motion.path d={donutSegment(30, 47, start, end)} fill="#1D4ED8"
                      initial={{ opacity: 0.15 }}
                      animate={{ opacity: [0.15, 0.5, 0.15] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
                  )}
                </g>
              );
            })}
          </svg>

          {/* 세그먼트 라벨 (아이콘 + 텍스트) */}
          {ANALYSIS_STAGES.map((s, i) => {
            const mid = i * seg + seg / 2;
            const [lx, ly] = polar(38.5, mid);
            const state = stateOf(i);
            const Icon = s.Icon;
            const tone = state === "done" ? "text-white" : state === "active" ? "text-white" : "text-slate-400";
            return (
              <div key={i}
                className="absolute flex flex-col items-center gap-0.5 pointer-events-none"
                style={{ left: `${lx}%`, top: `${ly}%`, transform: "translate(-50%, -50%)" }}>
                <Icon className={`w-4 h-4 ${tone}`} />
                <span className={`text-[10px] font-semibold leading-none ${tone}`}>{s.label}</span>
              </div>
            );
          })}

          {/* 중앙 허브 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-border shadow-sm flex flex-col items-center justify-center text-center"
            style={{ width: "52%", height: "52%" }}>
            {done
              ? <Check className="w-6 h-6 text-emerald-500 mb-1" />
              : <Loader2 className="w-5 h-5 text-primary mb-1 animate-spin" />}
            <div className="text-3xl font-bold leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {Math.round(progress)}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 px-2 truncate max-w-full">
              {done ? "완료" : current.label}
            </div>
          </div>
        </div>

        {/* 전체 진행률 + 현재 단계 설명 */}
        <div className="w-full mt-6" style={{ maxWidth: "min(88vw, 380px)" }}>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2.5 text-center">
            {done ? "학습 노트가 준비되었습니다." : current.sub}
          </p>
        </div>

        {/* 액션 */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button onClick={goToWorkspace}
            className="flex items-center gap-1.5 px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
            <Layers className="w-4 h-4" /> 워크스페이스에서 보기
          </button>
          {done ? (
            <button onClick={() => navigate("study")}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/25">
              <BookOpen className="w-4 h-4" /> 노트 열기 <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => navigate("dashboard")}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/25">
              백그라운드로 계속 <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── STUDY PAGE (AI 요약) ──────────────────────────────────────────────────────

interface SlideDef {
  n: number;
  ch: number;
  kind: "title" | "content" | "example" | "board";
  title: string;
  subtitle?: string;
}

const STUDY_SLIDES: SlideDef[] = [
  { n: 1, ch: 0, kind: "title", title: "배열과 연결리스트", subtitle: "Chapter 1 · 배열과 포인터" },
  { n: 2, ch: 0, kind: "content", title: "배열 (Array)" },
  { n: 3, ch: 0, kind: "content", title: "배열의 시간복잡도" },
  { n: 4, ch: 0, kind: "board", title: "배열 메모리 구조 (판서)" },
  { n: 5, ch: 1, kind: "title", title: "연결 리스트", subtitle: "Chapter 2 · Linked List" },
  { n: 6, ch: 1, kind: "content", title: "노드와 포인터" },
  { n: 7, ch: 1, kind: "example", title: "단순 연결 리스트 예제" },
  { n: 8, ch: 1, kind: "board", title: "삽입 연산 (판서)" },
  { n: 9, ch: 2, kind: "title", title: "이중 연결 리스트", subtitle: "Chapter 3 · Doubly Linked List" },
  { n: 10, ch: 2, kind: "content", title: "이중 연결 리스트 구조" },
  { n: 11, ch: 2, kind: "example", title: "양방향 순회 예제" },
  { n: 12, ch: 2, kind: "board", title: "원형 연결 리스트 (판서)" },
];

const STUDY_CHAPTERS = [
  {
    title: "Chapter 1", sub: "배열과 포인터", pages: "1 ~ 4페이지", slides: [1, 2, 3, 4],
    summary: [
      "배열은 같은 타입의 데이터를 연속된 메모리 공간에 저장한다.",
      "인덱스를 통해 임의 원소에 O(1)로 접근할 수 있다.",
      "삽입·삭제는 요소 이동이 필요해 O(n)이 소요된다.",
      "크기가 고정(정적)이며 캐시 지역성이 우수하다.",
    ],
  },
  {
    title: "Chapter 2", sub: "연결 리스트", pages: "5 ~ 8페이지", slides: [5, 6, 7, 8],
    summary: [
      "노드(data + next 포인터)가 연결된 선형 자료구조이다.",
      "삽입·삭제가 O(1)로 빠르지만 탐색은 O(n)이다.",
      "head 포인터 관리가 핵심이며 잃어버리면 메모리 누수가 발생한다.",
      "동적으로 크기를 변경할 수 있어 메모리 활용이 유연하다.",
    ],
  },
  {
    title: "Chapter 3", sub: "이중 연결 리스트", pages: "9 ~ 12페이지", slides: [9, 10, 11, 12],
    summary: [
      "각 노드가 prev/next 양방향 포인터를 가진다.",
      "양방향 순회가 가능하고 삭제 연산이 단순해진다.",
      "마지막 노드가 첫 노드를 가리키면 원형 연결 리스트가 된다.",
      "포인터가 늘어나 메모리 오버헤드는 커진다.",
    ],
  },
];

const STUDY_OVERALL =
  "이 강의는 선형 자료구조인 배열과 연결 리스트를 다룬다. 배열은 연속된 메모리로 O(1) 임의 접근을 제공하지만 크기가 고정되고 삽입·삭제가 느리다(O(n)). 연결 리스트는 포인터 기반으로 동적 크기와 빠른 삽입·삭제(O(1))가 장점이나 임의 접근이 느리다(O(n)). 이를 확장한 이중·원형 연결 리스트는 양방향 순회와 순환 구조를 구현할 수 있다.";

const STUDY_OVERALL_EN =
  "This lecture covers arrays and linked lists, the two fundamental linear data structures. Arrays store elements in contiguous memory, offering O(1) random access but fixed size and O(n) insertion/deletion. Linked lists use pointers, giving dynamic size and O(1) insertion/deletion at the cost of O(n) access. Doubly and circular linked lists extend this to enable bidirectional traversal and cyclic structures.";

const STUDY_CHAPTERS_EN = [
  ["An array stores same-typed elements in contiguous memory.", "Any element is accessible in O(1) via its index.", "Insertion/deletion needs shifting, costing O(n).", "Fixed size, but excellent cache locality."],
  ["A linked list chains nodes (data + next pointer).", "Insertion/deletion is O(1); search is O(n).", "The head pointer is critical — losing it leaks memory.", "Dynamically resizable and memory-flexible."],
  ["Each node holds both prev and next pointers.", "Enables bidirectional traversal; deletion is simpler.", "If the tail points to the head, it becomes circular.", "More pointers mean higher memory overhead."],
];

// AI 정리본 — 슬라이드 + 판서 + 녹음을 통합 분석해 새로 생성한 노트
type NoteBlock =
  | { type: "section"; title: string; body: string }
  | { type: "bullets"; items: string[] }
  | { type: "code"; lang: string; file: string; code: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "handwriting"; slide: number; text: string }
  | { type: "audio"; ts: string; slide: number; text: string };

interface ChapterNote {
  intro: string;
  meta: string;
  blocks: NoteBlock[];
}

const STUDY_NOTES: ChapterNote[] = [
  {
    intro: "배열은 데이터를 연속된 메모리 공간에 저장하는 가장 기본적인 선형 자료구조다. 이 챕터에서는 배열의 구조와 인덱스 접근이 왜 빠른지, 그리고 삽입·삭제의 비용을 분석한다.",
    meta: "슬라이드 4장 · 판서 2장 · 녹음 14분 반영",
    blocks: [
      { type: "section", title: "1. 배열 (Array)", body: "배열은 같은 타입의 데이터를 연속된 메모리 공간에 저장한다. 시작 주소에 인덱스×원소크기를 더해 원하는 위치를 바로 계산하므로 임의 접근이 상수 시간 O(1)에 이루어진다." },
      { type: "code", lang: "C 언어 예시", file: "array.c", code: `int arr[5] = {10, 20, 30, 40, 50};

// 인덱스로 접근: O(1)
int x = arr[2];  // x = 30

// 중간 삽입: O(n) - 이후 요소 이동 필요` },
      { type: "table", head: ["연산", "시간복잡도", "설명"], rows: [
        ["접근 (Access)", "O(1)", "인덱스로 직접 접근"],
        ["탐색 (Search)", "O(n)", "순차적으로 탐색"],
        ["삽입 (Insert)", "O(n)", "이후 요소 이동 필요"],
        ["삭제 (Delete)", "O(n)", "이후 요소 이동 필요"],
      ] },
      { type: "handwriting", slide: 4, text: "판서에서 교수님은 배열 원소의 주소가 [base + index × size] 로 계산됨을 도식으로 설명했습니다. 인덱스 접근이 O(1)인 근본 이유가 이 주소 계산식에 있음을 강조했습니다." },
      { type: "audio", ts: "15:23", slide: 3, text: "배열은 주로 stack 메모리에, 연결 리스트는 heap 메모리를 사용합니다. 이 차이가 성능에 미치는 영향이 커서 코딩 인터뷰에서 자주 나오는 주제입니다." },
    ],
  },
  {
    intro: "연결 리스트는 노드들이 포인터로 연결된 선형 자료구조로, 배열의 삽입·삭제 한계를 보완한다. 각 노드는 데이터와 다음 노드를 가리키는 포인터로 구성된다.",
    meta: "슬라이드 4장 · 판서 1장 · 녹음 10분 반영",
    blocks: [
      { type: "section", title: "1. 노드(Node)와 포인터", body: "연결 리스트의 각 노드는 데이터(data)와 다음 노드 주소(next)를 담는다. 원소들이 메모리에 흩어져 있어도 포인터로 논리적 순서를 유지하므로, 삽입·삭제 시 포인터만 바꾸면 되어 O(1)에 처리된다." },
      { type: "bullets", items: [
        "단순 연결 리스트(Singly): 다음 노드만 참조",
        "이중 연결 리스트(Doubly): 이전·다음 노드 모두 참조",
        "원형 연결 리스트(Circular): 마지막 노드가 첫 노드를 참조",
      ] },
      { type: "handwriting", slide: 8, text: "판서에서 노드 삽입 과정을 화살표로 도식화했습니다. 새 노드의 next를 다음 노드로, 이전 노드의 next를 새 노드로 연결하는 '순서'가 중요하다고 강조했습니다." },
      { type: "audio", ts: "28:45", slide: 6, text: "head 포인터를 잃어버리면 전체 리스트에 접근할 수 없게 됩니다. C 언어에서 메모리 누수의 주요 원인 중 하나입니다." },
    ],
  },
  {
    intro: "이중 연결 리스트는 각 노드가 앞뒤 노드를 모두 참조하여 양방향 순회를 지원한다. 삭제 연산이 단순해지고 원형 구조로 확장할 수 있다.",
    meta: "슬라이드 4장 · 판서 1장 · 녹음 9분 반영",
    blocks: [
      { type: "section", title: "1. 양방향 포인터 구조", body: "이중 연결 리스트의 노드는 prev와 next 두 포인터를 가진다. 덕분에 특정 노드에서 앞뒤로 자유롭게 이동할 수 있고, 삭제 시 이전 노드를 따로 탐색할 필요가 없어 연산이 단순해진다." },
      { type: "bullets", items: [
        "양방향 순회(정방향·역방향) 가능",
        "삭제 시 이전 노드 탐색 불필요 → 구현 단순",
        "마지막 노드가 head를 가리키면 원형 연결 리스트",
      ] },
      { type: "handwriting", slide: 12, text: "판서에서 원형 연결 리스트의 마지막 노드 next가 head를 가리키는 구조를 도식화했습니다. 순회 종료 조건을 head 도달로 잡아야 함을 강조했습니다." },
      { type: "audio", ts: "42:10", slide: 9, text: "Java나 Python은 가비지 컬렉터가 메모리를 관리하지만, C에서는 free()로 직접 해제해야 합니다. 다음 주 프로젝트에서 직접 구현해볼 예정입니다." },
    ],
  },
];

function NoteBlocks({ blocks, onSlide }: { blocks: NoteBlock[]; onSlide: (n: number) => void }) {
  return (
    <div className="space-y-6">
      {blocks.map((b, i) => {
        if (b.type === "section") return (
          <section key={i}>
            <h2 className="text-base font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{b.title}</h2>
            <p className="text-sm text-foreground leading-relaxed">{b.body}</p>
          </section>
        );
        if (b.type === "bullets") return (
          <div key={i} className="space-y-2.5">
            {b.items.map((it, j) => (
              <div key={j} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-primary">{j + 1}</span></div>
                <span className="text-sm leading-relaxed">{it}</span>
              </div>
            ))}
          </div>
        );
        if (b.type === "code") return (
          <div key={i} className="rounded-xl overflow-hidden border border-border">
            <div className="bg-slate-800 px-4 py-2 flex items-center justify-between"><span className="text-xs font-mono text-slate-400">{b.lang}</span><span className="text-xs text-slate-600">{b.file}</span></div>
            <div className="bg-slate-900 p-4"><pre className="text-xs font-mono text-slate-300 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.code}</pre></div>
          </div>
        );
        if (b.type === "table") return (
          <div key={i} className="rounded-xl overflow-hidden border border-border">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/60">{b.head.map((h, j) => <th key={j} className="text-left px-4 py-2.5 text-xs font-bold">{h}</th>)}</tr></thead>
              <tbody>{b.rows.map((r, j) => (<tr key={j} className="border-t border-border">{r.map((c, k) => <td key={k} className={`px-4 py-2.5 text-xs ${k === 1 ? "font-mono font-semibold text-amber-700" : "text-muted-foreground"}`}>{c}</td>)}</tr>))}</tbody>
            </table>
          </div>
        );
        if (b.type === "handwriting") return (
          <button key={i} onClick={() => onSlide(b.slide)} className="w-full text-left p-3.5 bg-amber-50 border border-amber-200 rounded-xl hover:border-amber-300 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0"><Pencil className="w-3.5 h-3.5 text-amber-700" /></div>
              <span className="text-xs font-bold text-amber-800">판서 기반 분석</span>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md ml-auto">슬라이드 {b.slide}</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">{b.text}</p>
          </button>
        );
        if (b.type === "audio") return (
          <button key={i} onClick={() => onSlide(b.slide)} className="w-full text-left p-3.5 bg-violet-50 border border-violet-200 rounded-xl hover:border-violet-300 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-violet-200 flex items-center justify-center flex-shrink-0"><Mic className="w-3.5 h-3.5 text-violet-700" /></div>
              <span className="text-xs font-bold text-violet-800">녹음 보충설명</span>
              <span className="text-[10px] text-violet-600 font-mono">{b.ts}</span>
              <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-md ml-auto">슬라이드 {b.slide}</span>
            </div>
            <p className="text-xs text-violet-800 leading-relaxed">{b.text}</p>
          </button>
        );
        return null;
      })}
    </div>
  );
}

// PDF 원본 슬라이드처럼 보이는 목업 (설명 없이 이미지로만)
function MockSlide({ slide }: { slide: SlideDef }) {
  if (slide.kind === "board") {
    return (
      <div className="w-full h-full bg-slate-900 p-4 flex flex-col justify-center gap-2.5">
        <div className="flex gap-3">
          <div className="h-2 w-1/3 rounded-full bg-green-400/80 -rotate-1" />
          <div className="h-2 w-1/4 rounded-full bg-rose-400/80 rotate-1" />
        </div>
        <div className="h-2 w-3/4 rounded-full bg-sky-400/80" />
        <div className="flex gap-3">
          <div className="h-2 w-1/2 rounded-full bg-amber-400/80" />
          <div className="h-2 w-1/5 rounded-full bg-rose-400/70" />
        </div>
        <div className="h-2 w-2/3 rounded-full bg-green-400/70 rotate-1" />
        <div className="h-2 w-2/5 rounded-full bg-sky-400/70" />
      </div>
    );
  }
  if (slide.kind === "title") {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col justify-center px-6">
        <div className="w-10 h-1 bg-amber-400 rounded-full mb-3" />
        <div className="text-amber-300 font-bold text-lg leading-tight mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{slide.title}</div>
        <div className="text-slate-400 text-xs">{slide.subtitle}</div>
      </div>
    );
  }
  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="bg-slate-900 px-4 py-2 flex-shrink-0">
        <span className="text-amber-300 font-bold text-sm">{slide.title}</span>
      </div>
      <div className="flex-1 p-4 space-y-2">
        {slide.kind === "example" && (
          <span className="inline-block text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold mb-1">Example</span>
        )}
        <div className="h-2 bg-slate-200 rounded-full w-5/6" />
        <div className="h-2 bg-slate-200 rounded-full w-full" />
        <div className="h-9 bg-blue-50 border border-blue-100 rounded-lg my-1" />
        <div className="h-2 bg-slate-200 rounded-full w-2/3" />
        <div className="h-2 bg-slate-200 rounded-full w-3/4" />
      </div>
    </div>
  );
}

// 하단 녹음 원본 플레이어 (두 번째 이미지 참고)
function AudioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(849); // 14:09
  const total = 2892; // 48:12

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setCur(c => (c >= total ? total : c + 1)), 1000);
    return () => clearInterval(t);
  }, [playing]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const pct = (cur / total) * 100;

  return (
    <div className="flex-shrink-0 border-t border-border bg-white p-3">
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Mic className="w-3.5 h-3.5" /> 녹음 원본
          </div>
          <span className="text-xs font-mono text-muted-foreground">{fmt(cur)} / {fmt(total)}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3 cursor-pointer"
          onClick={e => {
            const r = e.currentTarget.getBoundingClientRect();
            setCur(Math.round(((e.clientX - r.left) / r.width) * total));
          }}>
          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setCur(c => Math.max(0, c - 15))} className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button onClick={() => setPlaying(p => !p)}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button onClick={() => setCur(c => Math.min(total, c + 15))} className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StudyPage({ navigate }: NavProps) {
  const [leftW, setLeftW] = useState(300);
  const [rightW, setRightW] = useState(360);
  const [activeSlide, setActiveSlide] = useState(2);
  const [activeChapter, setActiveChapter] = useState(0);
  const [rightTab, setRightTab] = useState<"summary" | "translate" | "chat">("summary");
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set([2]));
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "안녕하세요! 이 강의 내용에 대해 무엇이든 물어보세요. 예: \"연결 리스트의 삽입은 왜 O(1)인가요?\"" },
  ]);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const draggingLeft = useRef(false);
  const draggingRight = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (draggingLeft.current) setLeftW(Math.max(240, Math.min(420, e.clientX - rect.left)));
    if (draggingRight.current) setRightW(Math.max(300, Math.min(480, rect.right - e.clientX)));
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingLeft.current = false;
    draggingRight.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); };
  }, [handleMouseMove, handleMouseUp]);

  const chapterOf = (n: number) => STUDY_SLIDES.find(s => s.n === n)?.ch ?? 0;
  const selectSlide = (n: number) => { setActiveSlide(n); setActiveChapter(chapterOf(n)); };
  const selectChapter = (i: number) => {
    setActiveChapter(i);
    const first = STUDY_CHAPTERS[i].slides[0];
    setActiveSlide(first);
    const el = listRef.current?.querySelector(`[data-slide="${first}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const toggleBookmark = (n: number) => setBookmarks(prev => {
    const s = new Set(prev);
    if (s.has(n)) s.delete(n); else s.add(n);
    return s;
  });

  const activeCh = STUDY_CHAPTERS[activeChapter];
  const activeNote = STUDY_NOTES[activeChapter];

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setMessages(prev => [
      ...prev,
      { role: "user", text },
      { role: "ai", text: "좋은 질문이에요! 강의 자료를 기반으로 답변을 생성하는 데모입니다. 실제 서비스에서는 업로드한 슬라이드·녹음·판서를 근거로 정확한 답을 제공합니다." },
    ]);
    setChatInput("");
  };

  const TOGGLES = [
    { key: "summary" as const, label: "요약", icon: Sparkles },
    { key: "translate" as const, label: "번역", icon: Languages },
    { key: "chat" as const, label: "챗봇", icon: MessageSquare },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 h-11 border-b border-border bg-white flex items-center px-4 gap-3">
        <button onClick={() => navigate("dashboard")} className="p-1.5 rounded-md hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <LectraLogo compact className="block" />
        <div className="h-4 w-px bg-border" />
        <span className="text-sm text-muted-foreground">자료구조</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">1장 - 배열과 연결리스트</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <Bell className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* ── Left: 슬라이드 목록 + 정보 + 녹음 ── */}
        <div className="flex-shrink-0 border-r border-border bg-white overflow-hidden flex flex-col" style={{ width: leftW }}>
          <div className="px-4 py-3 border-b border-border flex-shrink-0">
            <div className="text-sm font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>슬라이드</div>
            <div className="text-xs text-muted-foreground mt-0.5">전체 {STUDY_SLIDES.length}페이지 · {STUDY_CHAPTERS.length}챕터</div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
            {STUDY_SLIDES.map(slide => {
              const isActive = slide.n === activeSlide;
              const inActiveChapter = slide.ch === activeChapter;
              const marked = bookmarks.has(slide.n);
              return (
                <div key={slide.n} data-slide={slide.n}>
                  <div className="flex items-center justify-between mb-1 px-0.5">
                    <span className={`text-xs font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>{slide.n}</span>
                    {inActiveChapter && <span className="text-[10px] font-medium text-sky-500">Chapter {slide.ch + 1}</span>}
                  </div>
                  <button onClick={() => selectSlide(slide.n)}
                    className={`w-full aspect-[4/3] rounded-lg overflow-hidden relative border-2 transition-all ${
                      isActive ? "border-primary ring-2 ring-primary/20"
                      : inActiveChapter ? "border-sky-300 bg-sky-50"
                      : "border-border hover:border-primary/30"
                    }`}>
                    <MockSlide slide={slide} />
                    {inActiveChapter && !isActive && <div className="absolute inset-0 bg-sky-400/10 pointer-events-none" />}
                    <span onClick={e => { e.stopPropagation(); toggleBookmark(slide.n); }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/80 backdrop-blur-sm hover:bg-white transition-colors cursor-pointer">
                      <Bookmark className={`w-3.5 h-3.5 ${marked ? "fill-amber-400 text-amber-400" : "text-slate-400"}`} />
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <AudioPlayer />
        </div>

        {/* Left resize handle */}
        <div className="w-1 flex-shrink-0 bg-border hover:bg-primary/30 cursor-col-resize transition-colors"
          onMouseDown={() => { draggingLeft.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }} />

        {/* ── Center: AI 정리본 (슬라이드+판서+녹음 통합 분석) ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-shrink-0 h-11 border-b border-border bg-white flex items-center px-5 gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">AI 정리본</span>
            <span className="text-xs px-2 py-0.5 bg-sky-50 text-sky-600 rounded-full border border-sky-200 font-medium">Chapter {activeChapter + 1}</span>
            <span className="text-xs text-muted-foreground hidden lg:inline">슬라이드 · 판서 · 녹음 통합 분석</span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => selectChapter(Math.max(0, activeChapter - 1))} disabled={activeChapter === 0}
                className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-40">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">{activeChapter + 1} / {STUDY_CHAPTERS.length}</span>
              <button onClick={() => selectChapter(Math.min(STUDY_CHAPTERS.length - 1, activeChapter + 1))} disabled={activeChapter === STUDY_CHAPTERS.length - 1}
                className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-40">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
            <div className="max-w-2xl mx-auto px-8 py-6">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">{activeCh.title}</span>
                  <span className="text-xs text-muted-foreground">{activeCh.pages}</span>
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{activeCh.sub}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">{activeNote.intro}</p>
                <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
                  <Layers className="w-3.5 h-3.5 text-primary" /> {activeNote.meta}
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">핵심 요약</span>
                </div>
                {activeCh.summary.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-blue-800">{item}</span>
                  </div>
                ))}
              </div>

              <NoteBlocks blocks={activeNote.blocks} onSlide={selectSlide} />
            </div>
          </div>
        </div>

        {/* Right resize handle */}
        <div className="w-1 flex-shrink-0 bg-border hover:bg-primary/30 cursor-col-resize transition-colors"
          onMouseDown={() => { draggingRight.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }} />

        {/* ── Right: AI (요약 / 번역 / 챗봇) ── */}
        <div className="flex-shrink-0 bg-white overflow-hidden flex flex-col" style={{ width: rightW }}>
          {/* 토글 */}
          <div className="p-3 border-b border-border flex-shrink-0">
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              {TOGGLES.map(t => {
                const Icon = t.icon;
                const active = rightTab === t.key;
                return (
                  <button key={t.key} onClick={() => setRightTab(t.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${active ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <Icon className="w-4 h-4" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 요약 */}
          {rightTab === "summary" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">챕터별 요약</h3>
                </div>
                <div className="space-y-2.5">
                  {STUDY_CHAPTERS.map((ch, i) => {
                    const selected = activeChapter === i;
                    return (
                      <button key={i} onClick={() => selectChapter(i)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${selected ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200" : "border-border bg-background hover:border-primary/20"}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${selected ? "text-sky-600" : "text-primary"}`}>{ch.title}</span>
                            <span className="text-[11px] text-muted-foreground">{ch.pages}</span>
                          </div>
                          {selected && <span className="text-[10px] font-semibold text-sky-600 flex items-center gap-0.5"><Check className="w-3 h-3" /> 슬라이드 표시</span>}
                        </div>
                        <div className="text-sm font-semibold mb-2">{ch.sub}</div>
                        <ul className="space-y-1.5">
                          {ch.summary.map((s, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${selected ? "bg-sky-400" : "bg-primary/40"}`} />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">전체 강의자료 총 요약</h3>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-900 leading-relaxed">{STUDY_OVERALL}</p>
                </div>
              </div>
            </div>
          )}

          {/* 번역 */}
          {rightTab === "translate" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-muted rounded-lg font-medium">한국어</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg font-medium">English</span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">Chapter Summaries</h3>
                </div>
                <div className="space-y-2.5">
                  {STUDY_CHAPTERS.map((ch, i) => {
                    const selected = activeChapter === i;
                    return (
                      <button key={i} onClick={() => selectChapter(i)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${selected ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200" : "border-border bg-background hover:border-primary/20"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold ${selected ? "text-sky-600" : "text-primary"}`}>{ch.title}</span>
                          <span className="text-[11px] text-muted-foreground">{ch.pages}</span>
                        </div>
                        <ul className="space-y-1.5">
                          {STUDY_CHAPTERS_EN[i].map((s, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${selected ? "bg-sky-400" : "bg-primary/40"}`} />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">Overall Summary</h3>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-900 leading-relaxed">{STUDY_OVERALL_EN}</p>
                </div>
              </div>
            </div>
          )}

          {/* 챗봇 */}
          {rightTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-white rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-shrink-0 border-t border-border p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="강의 내용을 질문해보세요..."
                    className="flex-1 px-3.5 py-2.5 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                  <button onClick={sendMessage} disabled={!chatInput.trim()}
                    className="w-10 h-10 flex-shrink-0 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(EMPTY_DRAFT);
  const [dashTab, setDashTab] = useState<DashTab>("lectures");
  const [jobs, setJobs] = useState<Job[]>(makeInitialJobs);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // 전역 타이머: 어느 화면에 있든 분석 작업이 백그라운드에서 계속 진행된다
  useEffect(() => {
    const t = setInterval(() => {
      setJobs(prev => {
        let next = prev.map(j => {
          if (j.status !== "processing") return j;
          const np = Math.min(100, j.progress + j.speed);
          return { ...j, progress: np, status: np >= 100 ? "completed" : "processing" as JobStatus };
        });
        // 진행 슬롯이 비면 대기 중 작업을 승격
        let capacity = MAX_CONCURRENT - next.filter(j => j.status === "processing").length;
        if (capacity > 0) {
          next = next.map(j => {
            if (capacity > 0 && j.status === "queued") { capacity--; return { ...j, status: "processing" as JobStatus }; }
            return j;
          });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const addJob = (partial: Partial<Job>) => {
    const id = "job_" + Date.now();
    setJobs(prev => [
      {
        id,
        title: partial.title || "새 강의",
        week: partial.week,
        progress: 0,
        slides: partial.slides ?? 24,
        audioMin: partial.audioMin ?? 45,
        whiteboard: partial.whiteboard ?? 0,
        hasPdf: partial.hasPdf ?? true,
        hasAudio: partial.hasAudio ?? true,
        status: "processing",
        speed: 0.7,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    return id;
  };

  const cancelJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    setActiveJobId(prev => (prev === id ? null : prev));
  };

  const navigate = (s: Screen) => {
    window.scrollTo(0, 0);
    setScreen(s);
  };

  // 업로드 완료 → 새 작업 생성 후 분석 화면으로 이동
  const beginAnalysis = (partial: Partial<Job>) => {
    const id = addJob(partial);
    setActiveJobId(id);
    navigate("analysis");
  };

  // 워크스페이스 등에서 특정 작업의 분석 화면 다시 열기
  const viewAnalysis = (id: string) => {
    setActiveJobId(id);
    navigate("analysis");
  };

  const goToWorkspace = () => { setDashTab("workspace"); navigate("dashboard"); };
  const activeJob = jobs.find(j => j.id === activeJobId);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <AnimatePresence mode="wait">
        {screen === "landing" && <LandingPage key="landing" navigate={navigate} />}
        {screen === "login" && <LoginPage key="login" navigate={navigate} />}
        {screen === "dashboard" && (
          <DashboardPage key="dashboard" navigate={navigate} setProjectDraft={setProjectDraft}
            jobs={jobs} cancelJob={cancelJob} activeTab={dashTab} setActiveTab={setDashTab}
            onViewAnalysis={viewAnalysis} />
        )}
        {screen === "upload" && (
          <UploadPage key="upload" navigate={navigate} projectDraft={projectDraft}
            onAnalyze={beginAnalysis} />
        )}
        {screen === "analysis" && (
          <AnalysisPage key="analysis" navigate={navigate} job={activeJob} goToWorkspace={goToWorkspace} />
        )}
        {screen === "study" && <StudyPage key="study" navigate={navigate} />}
      </AnimatePresence>
    </div>
  );
}
