/* ================================================================
   AuthPage — Google 소셜 로그인 단독 (현 서비스 방침 기준)
   레이아웃: Command Center 온보딩 — 좌 화이트 비주얼 / 우 새추레이티드 패널
   ================================================================ */
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen bg-background">
      {/* 좌: 제품 비주얼 (웜 페이퍼) */}
      <div className="relative hidden flex-1 flex-col justify-between p-10 lg:flex">
        <div className="text-[19px] font-bold tracking-tight text-card-foreground">Lectra</div>
        <div className="mx-auto w-full max-w-md">
          {/* 미니 정렬 다이어그램 */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alignment preview</div>
            <div className="mt-3 space-y-2">
              {[["S12 · B-Tree insertion", "23:14", true], ["S13 · Split example", "25:02", false], ["S14 · Summary", "28:20", false]].map(([t, ts, hot]) => (
                <div key={t as string} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-[12.5px] ${hot ? "border-[var(--ember)] bg-[var(--ember-soft)]" : "border-border bg-[#FBFAF8]"}`}>
                  <span className="font-medium text-card-foreground">{t}</span>
                  <span className="tabular-nums text-muted-foreground">{ts}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-[var(--ember)] to-primary" />
            </div>
            <div className="mt-1.5 text-right text-[10.5px] tabular-nums text-muted-foreground">23:14 / 61:30</div>
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground">강의의 모든 문장을 슬라이드에 정렬합니다.</p>
      </div>

      {/* 우: 테라코타 패널 + 로그인 카드 */}
      <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-[#C2410C] via-[#B03A0A] to-[#7C2D12] p-8">
        <button
          onClick={() => (window.location.href = "/landing/index.html")}
          className="absolute right-6 top-6 flex items-center gap-1 rounded-full border border-white/30 px-3.5 py-1.5 text-[12.5px] font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/10"
        >
          <ChevronLeft size={13} /> Back
        </button>

        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_24px_48px_rgba(28,25,23,0.25)]">
          <div className="text-[15px] font-bold tracking-tight text-primary">Lectra</div>
          <h1 className="mt-4 text-[22px] font-bold tracking-tight text-card-foreground">Sign in to Lectra</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Access your library and lectures</p>

          <button
            onClick={() => navigate("/library")}
            className="mt-7 flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-white text-[14px] font-semibold text-card-foreground transition-all hover:border-primary/40 hover:shadow-[0_4px_12px_rgba(194,65,12,0.12)]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.16-3.16C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google로 계속하기
          </button>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            계속 진행하면 Lectra의 <a href="#" className="underline underline-offset-2 hover:text-primary">이용약관</a>과{" "}
            <a href="#" className="underline underline-offset-2 hover:text-primary">개인정보처리방침</a>에 동의하는 것입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
