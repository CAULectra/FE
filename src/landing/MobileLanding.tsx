/* ================================================================
   MobileLanding — 모바일 전용 경량 랜딩
   무거운 3D/스크롤 인터랙션을 걷어내고 워드마크 + 캐치프라이즈만.
   데모·핵심 기능은 PC 접속을 유도한다. 순수 CSS 페이드만 사용(런타임 루프 없음).
   ================================================================ */
import { useNavigate } from "react-router";
import "./mobile-landing.css";

export default function MobileLanding() {
  const navigate = useNavigate();

  return (
    <div className="mlanding">
      <div className="mlanding-bg" aria-hidden="true" />

      <main className="mlanding-inner">
        <div className="mlanding-hero">
          <h1 className="mlanding-wordmark">
            Lectra <span className="mlanding-note">note</span>
          </h1>
          <p className="mlanding-catch">흩어진 강의 자료를 하나의 노트로</p>
        </div>

        <div className="mlanding-pc">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="13" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <p>
            데모 영상과 핵심 기능은
            <br />
            <b>PC(데스크톱)</b>에서 만나보세요
          </p>
        </div>

        <button className="mlanding-cta" onClick={() => navigate("/auth")}>
          로그인하고 시작하기
        </button>
      </main>

      <footer className="mlanding-foot">
        <a href="mailto:lectranote@gmail.com">contact lectranote@gmail.com</a>
      </footer>
    </div>
  );
}
