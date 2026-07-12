import { useEffect, useRef } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

/** PDFDocumentProxy의 page(1-based)를 부모 폭에 맞춰 캔버스로 렌더. */
export default function PdfPage({ pdf, page, className, onError }: { pdf: PDFDocumentProxy; page: number; className?: string; onError?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | undefined;
    (async () => {
      try {
        const p = await pdf.getPage(page);
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parentW = canvas.parentElement?.clientWidth ?? 280;
        const dpr = window.devicePixelRatio || 1;
        const base = p.getViewport({ scale: 1 });
        const vp = p.getViewport({ scale: (parentW / base.width) * dpr });
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        task = p.render({ canvas, canvasContext: ctx, viewport: vp });
        await task.promise;
      } catch (e) {
        // 페이지 로드/렌더 실패(손상 페이지, slide_number가 numPages 초과 등) → 상위에서 텍스트 폴백하도록 통지
        if (!cancelled) {
          console.warn("[pdf] 페이지 렌더 실패:", page, e);
          onError?.();
        }
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, page]);

  return <canvas ref={canvasRef} className={className} />;
}
