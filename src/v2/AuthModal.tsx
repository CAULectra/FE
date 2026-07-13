/* ================================================================
   AuthModal — 인증이 필요한 액션(업로드 등)에서 뜨는 로그인/회원가입 창
   게스트가 '업로드하기'를 누르면 여기서 로그인/회원가입 후 진행한다.
   구글 auth-code 팝업 → 백엔드 검증 → onLogin(user)로 상위(AppShell)에 전달.
   ================================================================ */
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../app/components/ui/dialog";
import { api, setToken, setRefreshToken, type LoginUser } from "../api";

export default function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (user?: LoginUser | null) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async ({ code }) => {
      setLoading(true);
      setError(null);
      try {
        const { access_token, refresh_token, user } = await api.loginGoogle(code);
        setToken(access_token);
        setRefreshToken(refresh_token);   // refresh 토큰 저장 (자동 갱신·로그아웃 폐기용)
        onLogin(user ?? null);   // AppShell이 login(user) + 모달 닫기 처리
      } catch (e) {
        setError(e instanceof Error ? e.message : "로그인에 실패했습니다.");
        setLoading(false);
      }
    },
    onError: () => setError("구글 로그인이 취소되었거나 실패했습니다."),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold tracking-tight text-primary">Lectra</DialogTitle>
        </DialogHeader>

        <div className="pt-1">
          <h2 className="text-[20px] font-bold tracking-tight text-card-foreground">로그인하고 시작하기</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            로그인 또는 회원가입 후 내 자료를 업로드하고 노트를 만들 수 있어요.
          </p>

          <button
            onClick={() => googleLogin()}
            disabled={loading}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-white text-[14px] font-semibold text-card-foreground transition-all hover:border-primary/40 hover:shadow-[0_4px_12px_rgba(194,65,12,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> 로그인 중...
              </>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.16-3.16C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google로 계속하기
              </>
            )}
          </button>

          {error && <p className="mt-3 text-center text-[12px] text-destructive">{error}</p>}

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            로그인·회원가입은 모두 Google 계정으로 진행됩니다.<br />
            계속하면 Lectra의 <a href="#" className="underline underline-offset-2 hover:text-primary">이용약관</a>과{" "}
            <a href="#" className="underline underline-offset-2 hover:text-primary">개인정보처리방침</a>에 동의하는 것입니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
