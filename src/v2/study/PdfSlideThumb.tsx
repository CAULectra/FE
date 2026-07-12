import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import PdfPage from "./PdfPage";

/** IntersectionObserver로 뷰포트 진입 시에만 PDF 페이지를 렌더(지연 렌더). 한 번 보이면 유지. */
export default function PdfSlideThumb({ pdf, page, title }: { pdf: PDFDocumentProxy; page: number; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [failed, setFailed] = useState(false); // 페이지 렌더 실패 시 텍스트 폴백

  useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  return (
    <div ref={ref} className="w-full">
      {seen && !failed ? (
        <PdfPage pdf={pdf} page={page} className="block w-full" onError={() => setFailed(true)} />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#FAF8F5] px-3 text-center">
          <span className="line-clamp-3 text-[11px] font-medium leading-snug text-muted-foreground">{title}</span>
        </div>
      )}
    </div>
  );
}
