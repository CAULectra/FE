import { useEffect, useState } from "react";
import {
  ChevronLeft, Loader2, FileText, Languages, AlertCircle, ScanText, Sparkles,
} from "lucide-react";
import { api, type Lecture } from "../api";
import { LectraLogo } from "./components/LectraLogo";

const LANGS = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

// 명세 기반 결과 페이지: GET /lectures/{id}/slides 로 슬라이드·원문·OCR 표시 + 슬라이드 번역
export function LectureResult({ lectureId, onBack }: { lectureId: number; onBack: () => void }) {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlideId, setActiveSlideId] = useState<number | null>(null);

  const [lang, setLang] = useState("en");
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  // 강의 상세(슬라이드) 로드
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api.getLectureSlides(lectureId)
      .then(l => {
        if (!alive) return;
        setLecture(l);
        setActiveSlideId(l.slides[0]?.id ?? null);
      })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : "강의를 불러오지 못했습니다."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [lectureId]);

  const activeSlide = lecture?.slides.find(s => s.id === activeSlideId) ?? null;

  // 슬라이드가 바뀌면 이전 번역 초기화
  useEffect(() => { setTranslation(null); }, [activeSlideId]);

  const translate = async () => {
    if (!activeSlide) return;
    setTranslating(true);
    try {
      const r = await api.translateSlide(activeSlide.id, lang);
      setTranslation(r.translated_text);
    } catch (e) {
      setTranslation(e instanceof Error ? `번역 실패: ${e.message}` : "번역에 실패했습니다.");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* 상단 바 */}
      <header className="flex-shrink-0 h-12 border-b border-border bg-white flex items-center px-4 gap-3">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <LectraLogo compact className="block" />
        <div className="h-4 w-px bg-border" />
        <span className="text-sm font-semibold truncate">{lecture?.title ?? "강의 결과"}</span>
        {lecture && (
          <span className="text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground flex-shrink-0">
            슬라이드 {lecture.slides.length}
          </span>
        )}
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">강의 결과를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs text-muted-foreground">서버 연결 상태를 확인해주세요.</p>
        </div>
      ) : !lecture || lecture.slides.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <FileText className="w-8 h-8" />
          <p className="text-sm">표시할 슬라이드가 없습니다.</p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* 왼쪽: 슬라이드 목록 */}
          <aside className="w-64 border-r border-border bg-white overflow-y-auto flex-shrink-0">
            <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">슬라이드</div>
            <div className="px-2 pb-4 space-y-1">
              {lecture.slides.map(s => {
                const active = s.id === activeSlideId;
                return (
                  <button key={s.id} onClick={() => setActiveSlideId(s.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${active ? "bg-primary/10" : "hover:bg-muted"}`}>
                    <span className={`mt-0.5 text-[11px] font-bold w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${active ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                      {s.page_num}
                    </span>
                    <span className={`text-xs leading-snug line-clamp-2 ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {s.text_content || `슬라이드 ${s.page_num}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* 가운데: 선택 슬라이드 상세 */}
          <main className="flex-1 overflow-y-auto">
            {activeSlide && (
              <div className="max-w-3xl mx-auto px-6 py-8">
                {/* 슬라이드 이미지 (image_path) */}
                <div className="rounded-2xl border border-border bg-white overflow-hidden mb-6">
                  <div className="aspect-[16/10] bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FileText className="w-10 h-10" />
                    <span className="text-sm font-medium">슬라이드 {activeSlide.page_num}</span>
                    <span className="text-[11px] font-mono opacity-70">{activeSlide.image_path}</span>
                  </div>
                </div>

                {/* 원문 (text_content) */}
                <section className="mb-6">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold mb-2">
                    <FileText className="w-4 h-4 text-primary" /> 원문 텍스트
                  </h3>
                  <div className="rounded-xl border border-border bg-white p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {activeSlide.text_content || <span className="text-muted-foreground">추출된 텍스트가 없습니다.</span>}
                  </div>
                </section>

                {/* OCR (ocr_text) */}
                <section className="mb-6">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold mb-2">
                    <ScanText className="w-4 h-4 text-violet-500" /> OCR 인식 텍스트
                  </h3>
                  <div className="rounded-xl border border-border bg-white p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {activeSlide.ocr_text || <span className="opacity-70">OCR 결과가 없습니다.</span>}
                  </div>
                </section>

                {/* 번역 (POST /slides/{id}/translate) */}
                <section>
                  <h3 className="flex items-center gap-1.5 text-sm font-bold mb-2">
                    <Languages className="w-4 h-4 text-emerald-500" /> 번역
                  </h3>
                  <div className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <select value={lang} onChange={e => setLang(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/25">
                        {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                      <button onClick={translate} disabled={translating}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {translating
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 번역 중...</>
                          : <><Sparkles className="w-3.5 h-3.5" /> 번역하기</>}
                      </button>
                    </div>
                    {translation !== null && (
                      <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {translation}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
