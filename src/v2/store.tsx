/* ================================================================
   Lectra v2 — 앱 스토어 (폴더/강의 + 처리 파이프라인 ticker)
   - 전역 1초 ticker가 processing 강의를 진행시키고,
     슬롯(MAX_CONCURRENT=2)이 비면 queued를 승격한다.
   - 어떤 화면에 있든 진행되므로 "페이지를 떠나도 계속" 이 성립.
   ================================================================ */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Folder, Lecture } from "./types";
import { SEED_FOLDERS, SEED_LECTURES } from "./data";
import { getToken, getUser, setUser as persistUser, clearToken, clearUser, getDeletedLectureIds, addDeletedLectureId, USE_MOCK, api, type LoginUser, type BackendStatus } from "../api";
import { lectureFromListItem, excludeDeleted, jobToPatch, UNCATEGORIZED_FOLDER_ID, type JobPatch } from "./adapters";

const MAX_CONCURRENT = 2;
const RATE = 1.4; // %/초 — 데모용 처리 속도
const DEMO_LIVE_ID = "demo-live"; // 워크스페이스 진행바 확인용 — 완료 안 하고 진행 순환

/** progress → 단계 index. 밴드: [0,8)업로드 [8,34)STT [34,55)추출 [55,78)정렬 [78,100)노트생성 100=완료 */
export const stepOfProgress = (p: number): number =>
  p >= 100 ? 5 : p >= 78 ? 4 : p >= 55 ? 3 : p >= 34 ? 2 : p >= 8 ? 1 : 0;

export interface NewLectureInput {
  title: string;
  folderId: string;
  hasAudio: boolean;
  slideCount: number;
  photoCount: number;
  audioSec: number;
}

/** 실서버 업로드 완료(process 호출까지) 후 폴링 대상으로 등록할 강의 */
export interface RegisterJobInput {
  id: string;                // BE lecture_id (uuid)
  jobId: string;             // BE job_id → GET /jobs/{jobId} 폴링
  title: string;
  folderId: string;
  hasAudio: boolean;
  photoCount?: number;
  status: BackendStatus;     // process() 응답의 초기 status
}

interface AppStore {
  folders: Folder[];
  lectures: Lecture[];
  addFolder: (name: string) => Promise<string | null>;  // 중복이면 null (real: POST /folders)
  renameFolder: (id: string, name: string) => Promise<void>;
  removeFolder: (id: string) => Promise<void>;           // 소속 강의는 미분류로 이동(BE 동일)
  addLecture: (input: NewLectureInput) => string;  // 새 lecture id
  registerJob: (input: RegisterJobInput) => void;  // 실서버 업로드→process 후 폴링 등록
  startProcessing: (id: string) => void;           // 업로드만 된(status null) 강의 → 분석 시작
  removeLecture: (id: string) => void;
  renameLecture: (id: string, title: string) => void;
  moveLecture: (id: string, folderId: string) => Promise<void>;
  retryLecture: (id: string) => void;              // failed → 재실행
  cancelJob: (id: string) => void;                 // processing/queued 취소(삭제)
  /* 게스트/인증 — 게스트는 라이브러리가 비어 보이고, 업로드 시 로그인 유도 */
  authed: boolean;
  user: LoginUser | null;
  login: (user?: LoginUser | null) => void;   // 구글 로그인 성공 시 유저 저장 + authed
  logout: () => void;
  /* 즐겨찾기 (강의 id 목록) */
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

const Ctx = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>(USE_MOCK ? SEED_FOLDERS : []);
  // 목업 모드: 데모 SEED. 실서버 모드: 로그인 후 GET /lectures 로 채움.
  const [lectures, setLectures] = useState<Lecture[]>(USE_MOCK ? SEED_LECTURES : []);
  // 저장된 토큰이 있으면 로그인 상태로 복원 → 새로고침해도 유지
  const [authed, setAuthed] = useState<boolean>(() => !!getToken());
  const [user, setUserState] = useState<LoginUser | null>(() => getUser());

  // 실서버 모드에서 강의 목록을 BE에서 로드 → 어댑터로 v2 모델 변환.
  // 실패해도 크래시 없이 빈 목록(호출부에서 report 가능).
  const refreshLectures = useCallback(async () => {
    if (USE_MOCK) return; // 목업은 SEED 유지
    try {
      const list = await api.getLectures();
      // 클라이언트에서 삭제한 강의는 제외 — BE에 강의 DELETE가 없어 재요청 시 되살아나는 것 방지(BUG4)
      setLectures(excludeDeleted(list.map(lectureFromListItem), getDeletedLectureIds()));
    } catch (e) {
      console.warn("[store] getLectures 실패:", e);
      setLectures([]);
    }
  }, []);

  // 실서버 모드: 폴더 목록도 BE에서 로드(GET /folders). 목업은 SEED 유지.
  const refreshFolders = useCallback(async () => {
    if (USE_MOCK) return;
    try {
      const list = await api.listFolders();
      setFolders(list.map((f) => ({ id: f.id, name: f.name })));
    } catch (e) {
      console.warn("[store] listFolders 실패:", e);
    }
  }, []);

  // 구글 로그인 성공 시: 유저 저장 + authed + 실데이터 로드. (토큰 저장은 호출부에서 setToken)
  const login = useCallback((u?: LoginUser | null) => {
    if (u !== undefined) { persistUser(u ?? null); setUserState(u ?? null); }
    setAuthed(true);
    void refreshLectures();
    void refreshFolders();
  }, [refreshLectures, refreshFolders]);
  const logout = useCallback(() => {
    clearToken(); clearUser(); setUserState(null); setAuthed(false);
    setLectures(USE_MOCK ? SEED_LECTURES : []);
  }, []);

  // 새로고침 복원: 실서버 모드에서 토큰이 있으면 강의·폴더 목록 재로드
  useEffect(() => {
    if (!USE_MOCK && getToken()) { void refreshLectures(); void refreshFolders(); }
  }, [refreshLectures, refreshFolders]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  /* ---- 처리 파이프라인 ticker (목업 데모 전용) ----
     실서버 모드에선 가짜 진행을 돌리지 않는다. 실제 진행률은 추후 GET /jobs/{id} 폴링으로. */
  useEffect(() => {
    if (!USE_MOCK) return;
    const iv = setInterval(() => {
      setLectures((prev) => {
        let processingCount = prev.filter((l) => l.status === "processing").length;
        return prev.map((l) => {
          if (l.jobId) return l; // 실 job 폴링이 담당 — 데모 ticker는 건드리지 않음
          if (l.status === "processing") {
            if (l.id === DEMO_LIVE_ID) {
              // 데모: 완료시키지 않고 진행을 순환(6→95) → 워크스페이스 진행바를 언제든 확인
              const np = l.progress + RATE * 1.1;
              const looped = np >= 95 ? 6 : np;
              return { ...l, progress: looped, stepIndex: stepOfProgress(looped), etaMin: 4 };
            }
            const progress = Math.min(100, l.progress + RATE * (0.7 + Math.random() * 0.6));
            if (progress >= 100) {
              processingCount -= 1;
              return { ...l, progress: 100, stepIndex: 5, status: "ready" as const, etaMin: 0 };
            }
            return { ...l, progress, stepIndex: stepOfProgress(progress), etaMin: Math.max(1, Math.round((100 - progress) / RATE / 60)) };
          }
          if (l.status === "queued" && processingCount < MAX_CONCURRENT) {
            processingCount += 1;
            return { ...l, status: "processing" as const, progress: 2, stepIndex: 0, queueOrder: undefined };
          }
          return l;
        });
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  /* ---- 실서버 job 폴링 ticker ----
     처리중인 강의의 실제 progress/status를 BE에서 가져온다(목·실 공통 — 둘 다 getJob 구현).
     - jobId 있는 강의(방금 업로드) → GET /jobs/{jobId} (실측 % 제공)
     - jobId 없는 처리중 강의(새로고침으로 목록에서 복원) → 실모드에서 GET /lectures로 status 갱신
     progress는 단조 증가(뒤로 안 감), 완료=ready / 실패=failed 로 종료. */
  const lecturesRef = useRef<Lecture[]>(lectures);
  useEffect(() => { lecturesRef.current = lectures; }, [lectures]);
  useEffect(() => {
    const isActive = (s: Lecture["status"]) => s === "processing" || s === "queued" || s === "uploading";
    const applyPatch = (l: Lecture, patch: JobPatch): Lecture => {
      // 완료/실패는 상한을 최종값으로 고정해 트리클을 멈춘다.
      const cap = patch.status === "ready" ? 100 : patch.status === "failed" ? patch.progress : patch.cap;
      const progress = Math.min(cap, Math.max(l.progress, patch.progress));
      return {
        ...l,
        status: patch.status,
        progress,
        progressCap: cap,
        stepIndex: patch.stepIndex,
        failedStep: patch.failedStep,
        etaMin: patch.status === "ready" ? 0 : Math.max(1, Math.round((100 - progress) / 12)),
      };
    };
    let cancelled = false;
    let running = false;        // #25: 이전 틱이 아직 진행 중이면 스킵 — 중복/겹침 호출 제거
    let listPollCount = 0;      // #25: 전체 목록 폴백은 무거우니 3틱(=6초)마다만
    const tick = async () => {
      if (running) return;
      const cur = lecturesRef.current;
      const jobLectures = cur.filter((l) => l.jobId && isActive(l.status));
      const listLectures = cur.filter((l) => !l.jobId && isActive(l.status));
      if (jobLectures.length === 0 && (USE_MOCK || listLectures.length === 0)) return;
      running = true;
      try {
        const patches = new Map<string, JobPatch>();
        // 1) 실제 job 폴링 (실측 progress) — 매 틱(2초). 잡 단위라 가볍다.
        await Promise.all(jobLectures.map(async (l) => {
          try { patches.set(l.id, jobToPatch(await api.getJob(l.jobId!))); }
          catch (e) { console.warn("[store] getJob 실패:", l.jobId, e); }
        }));
        // 2) jobId 없이 복원된 처리중 강의 → 전체 목록 status로 보강 (실모드만).
        //    GET /lectures 전체 조회는 무거워 매 2초가 아니라 3틱(=6초)마다만 호출한다(#25: 13회+ 중복호출 방지).
        if (!USE_MOCK && listLectures.length > 0 && listPollCount++ % 3 === 0) {
          try {
            const list = await api.getLectures();
            const byId = new Map(list.map((i) => [i.id, i]));
            for (const l of listLectures) {
              const item = byId.get(l.id);
              if (item?.status) patches.set(l.id, jobToPatch({ status: item.status }));
            }
          } catch (e) { console.warn("[store] getLectures(폴링) 실패:", e); }
        }
        if (cancelled || patches.size === 0) return;
        setLectures((prev) => prev.map((l) => {
          const patch = patches.get(l.id);
          return patch ? applyPatch(l, patch) : l;
        }));
      } finally {
        running = false;
      }
    };
    const iv = setInterval(() => { void tick(); }, 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  /* ---- 트리클 ----
     폴링 사이(2초)에 진행바가 멈춰 보이지 않도록, progress를 progressCap 직전까지 아주 천천히 올린다.
     상한(다음 단계 -1)을 절대 넘지 않으므로 100%를 거짓으로 채우지 않는다. */
  useEffect(() => {
    const iv = setInterval(() => {
      setLectures((prev) => {
        let changed = false;
        const next = prev.map((l) => {
          if (!l.jobId || l.progressCap === undefined) return l;
          if (l.status !== "processing" && l.status !== "queued") return l;
          if (l.progress >= l.progressCap) return l;
          const step = Math.max(0.25, (l.progressCap - l.progress) * 0.05); // 감속 이징
          const np = Math.min(l.progressCap, l.progress + step);
          if (np <= l.progress) return l;
          changed = true;
          return { ...l, progress: np, etaMin: Math.max(1, Math.round((100 - np) / 12)) };
        });
        return changed ? next : prev;
      });
    }, 450);
    return () => clearInterval(iv);
  }, []);

  const addFolder = useCallback(async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (!USE_MOCK) {
      // 실서버: POST /folders → 서버 id로 반영 (get_or_create라 중복명이면 기존 반환)
      try {
        const f = await api.createFolder(trimmed);
        setFolders((prev) => (prev.some((p) => p.id === f.id) ? prev : [...prev, { id: f.id, name: f.name }]));
        return f.id;
      } catch (e) {
        console.warn("[store] createFolder 실패:", e);
        return null;
      }
    }
    let created: string | null = null;
    setFolders((prev) => {
      if (prev.some((f) => f.name === trimmed)) return prev;
      created = `f_${Date.now()}`;
      return [...prev, { id: created, name: trimmed }];
    });
    return created;
  }, []);

  const renameFolder = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!USE_MOCK) {
      try { await api.renameFolder(id, trimmed); }
      catch (e) { console.warn("[store] renameFolder 실패:", e); return; }
    }
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: trimmed } : f)));
  }, []);

  const removeFolder = useCallback(async (id: string) => {
    if (!USE_MOCK) {
      try { await api.deleteFolder(id); }
      catch (e) { console.warn("[store] deleteFolder 실패:", e); return; }
    }
    setFolders((prev) => prev.filter((f) => f.id !== id));
    // BE와 동일: 폴더 삭제 시 소속 강의는 지우지 않고 미분류로 이동
    setLectures((prev) => prev.map((l) => (l.folderId === id ? { ...l, folderId: UNCATEGORIZED_FOLDER_ID } : l)));
  }, []);

  const addLecture = useCallback((input: NewLectureInput): string => {
    const id = `lec_${Date.now()}`;
    setLectures((prev) => {
      const processingCount = prev.filter((l) => l.status === "processing").length;
      const queuedCount = prev.filter((l) => l.status === "queued").length;
      const startNow = processingCount < MAX_CONCURRENT;
      const now = new Date();
      const lec: Lecture = {
        id,
        title: input.title,
        folderId: input.folderId,
        uploadedAt: now.toISOString(), // 전체 타임스탬프 → 방금 올린 강의가 같은 날 목록 최상단(BUG3)
        updatedLabel: now.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        status: startNow ? "processing" : "queued",
        progress: startNow ? 2 : 0,
        stepIndex: 0,
        etaMin: 7,
        queueOrder: startNow ? undefined : queuedCount + 1,
        slideCount: input.slideCount,
        audioSec: input.audioSec,
        photoCount: input.photoCount,
        hasAudio: input.hasAudio,
      };
      return [lec, ...prev];
    });
    return id;
  }, []);

  // 실서버 업로드(pdf→audio→board→process) 완료 후, 진짜 job을 폴링 대상으로 등록.
  const registerJob = useCallback((input: RegisterJobInput) => {
    const patch = jobToPatch({ status: input.status });
    const now = new Date();
    const lec: Lecture = {
      id: input.id,
      title: input.title,
      folderId: input.folderId,
      uploadedAt: now.toISOString(), // 전체 타임스탬프 → 방금 올린 강의가 같은 날 목록 최상단(BUG3)
      updatedLabel: now.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      status: patch.status,
      progress: patch.progress,
      progressCap: patch.cap,
      stepIndex: patch.stepIndex,
      etaMin: 7,
      jobId: input.jobId,
      hasAudio: input.hasAudio,
      photoCount: input.photoCount,
    };
    setLectures((prev) => [lec, ...prev.filter((l) => l.id !== input.id)]); // 같은 id 중복 방지
  }, []);

  // 업로드만 된(status null='uploaded') 강의를 분석 시작 — POST /process 후 job 폴링 등록.
  const startProcessing = useCallback(async (id: string) => {
    try {
      const job = await api.process(id);
      const patch = jobToPatch({ status: job.status });
      setLectures((prev) => prev.map((l) =>
        l.id === id
          ? { ...l, status: patch.status, progress: patch.progress, progressCap: patch.cap, stepIndex: patch.stepIndex, jobId: job.job_id, failedStep: undefined, errorCode: undefined }
          : l,
      ));
    } catch (e) {
      console.warn("[store] 분석 시작 실패:", e);
    }
  }, []);

  const removeLecture = useCallback((id: string) => {
    addDeletedLectureId(id); // tombstone → 새로고침(재요청)해도 다시 안 나타남(BUG4)
    setLectures((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const renameLecture = useCallback((id: string, title: string) => {
    setLectures((prev) => prev.map((l) => (l.id === id ? { ...l, title } : l)));
  }, []);

  const moveLecture = useCallback(async (id: string, folderId: string) => {
    if (!USE_MOCK) {
      // 미분류(UNCAT)는 BE folder_id=null 로 변환해서 전송
      const beFolderId = folderId === UNCATEGORIZED_FOLDER_ID ? null : folderId;
      try { await api.updateLectureFolder(id, beFolderId); }
      catch (e) { console.warn("[store] moveLecture 실패:", e); return; }
    }
    setLectures((prev) => prev.map((l) => (l.id === id ? { ...l, folderId } : l)));
  }, []);

  const retryLecture = useCallback((id: string) => {
    setLectures((prev) => prev.map((l) =>
      l.id === id && l.status === "failed"
        ? { ...l, status: "processing", failedStep: undefined, errorCode: undefined }
        : l,
    ));
  }, []);

  const cancelJob = useCallback((id: string) => {
    addDeletedLectureId(id); // 처리중 취소=삭제 → tombstone으로 재요청에도 유지(BUG4)
    setLectures((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const value = useMemo<AppStore>(() => ({
    folders, lectures, authed, user, login, logout, favorites, toggleFavorite,
    addFolder, renameFolder, removeFolder,
    addLecture, registerJob, startProcessing, removeLecture, renameLecture, moveLecture, retryLecture, cancelJob,
  }), [folders, lectures, authed, user, login, logout, favorites, toggleFavorite, addFolder, renameFolder, removeFolder, addLecture, registerJob, startProcessing, removeLecture, renameLecture, moveLecture, retryLecture, cancelJob]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
