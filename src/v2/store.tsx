/* ================================================================
   Lectra v2 — 앱 스토어 (폴더/강의 + 처리 파이프라인 ticker)
   - 전역 1초 ticker가 processing 강의를 진행시키고,
     슬롯(MAX_CONCURRENT=2)이 비면 queued를 승격한다.
   - 어떤 화면에 있든 진행되므로 "페이지를 떠나도 계속" 이 성립.
   ================================================================ */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Folder, Lecture } from "./types";
import { SEED_FOLDERS, SEED_LECTURES } from "./data";
import { getToken, getUser, setUser as persistUser, clearToken, clearUser, type LoginUser } from "../api";

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

interface AppStore {
  folders: Folder[];
  lectures: Lecture[];
  addFolder: (name: string) => string | null;      // 중복이면 null
  renameFolder: (id: string, name: string) => void;
  removeFolder: (id: string) => void;
  addLecture: (input: NewLectureInput) => string;  // 새 lecture id
  removeLecture: (id: string) => void;
  renameLecture: (id: string, title: string) => void;
  moveLecture: (id: string, folderId: string) => void;
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
  const [folders, setFolders] = useState<Folder[]>(SEED_FOLDERS);
  const [lectures, setLectures] = useState<Lecture[]>(SEED_LECTURES);
  // 저장된 토큰이 있으면 로그인 상태로 복원 → 새로고침해도 유지
  const [authed, setAuthed] = useState<boolean>(() => !!getToken());
  const [user, setUserState] = useState<LoginUser | null>(() => getUser());
  // 구글 로그인 성공 시: 유저 저장 + authed. (토큰 저장은 호출부에서 setToken)
  const login = useCallback((u?: LoginUser | null) => {
    if (u !== undefined) { persistUser(u ?? null); setUserState(u ?? null); }
    setAuthed(true);
  }, []);
  const logout = useCallback(() => {
    clearToken(); clearUser(); setUserState(null); setAuthed(false);
  }, []);
  const [favorites, setFavorites] = useState<string[]>([]);
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  /* ---- 처리 파이프라인 ticker ---- */
  useEffect(() => {
    const iv = setInterval(() => {
      setLectures((prev) => {
        let processingCount = prev.filter((l) => l.status === "processing").length;
        return prev.map((l) => {
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

  const addFolder = useCallback((name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    let created: string | null = null;
    setFolders((prev) => {
      if (prev.some((f) => f.name === trimmed)) return prev;
      created = `f_${Date.now()}`;
      return [...prev, { id: created, name: trimmed }];
    });
    return created;
  }, []);

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
  }, []);

  const removeFolder = useCallback((id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setLectures((prev) => prev.filter((l) => l.folderId !== id));
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
        uploadedAt: now.toISOString().slice(0, 10),
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

  const removeLecture = useCallback((id: string) => {
    setLectures((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const renameLecture = useCallback((id: string, title: string) => {
    setLectures((prev) => prev.map((l) => (l.id === id ? { ...l, title } : l)));
  }, []);

  const moveLecture = useCallback((id: string, folderId: string) => {
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
    setLectures((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const value = useMemo<AppStore>(() => ({
    folders, lectures, authed, user, login, logout, favorites, toggleFavorite,
    addFolder, renameFolder, removeFolder,
    addLecture, removeLecture, renameLecture, moveLecture, retryLecture, cancelJob,
  }), [folders, lectures, authed, user, login, logout, favorites, toggleFavorite, addFolder, renameFolder, removeFolder, addLecture, removeLecture, renameLecture, moveLecture, retryLecture, cancelJob]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
