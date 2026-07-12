import { useEffect, useState } from "react";
import { getDocument, type PDFDocumentProxy } from "pdfjs-dist";
import "./pdfjs-setup";

interface PdfDocState {
  pdf: PDFDocumentProxy | null;
  loading: boolean;
  error: boolean;
}

/** pdf_url → PDFDocumentProxy 로드(1회). url이 바뀌면 재로드(만료 재발급 대응). */
export function usePdfDocument(pdfUrl: string | null | undefined): PdfDocState {
  const [state, setState] = useState<PdfDocState>({ pdf: null, loading: !!pdfUrl, error: false });

  useEffect(() => {
    if (!pdfUrl) {
      setState({ pdf: null, loading: false, error: false });
      return;
    }
    let cancelled = false;
    setState({ pdf: null, loading: true, error: false });
    const task = getDocument({ url: pdfUrl });
    task.promise
      .then((pdf) => {
        if (!cancelled) setState({ pdf, loading: false, error: false });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          console.warn("[pdf] 로드 실패:", e);
          setState({ pdf: null, loading: false, error: true });
        }
      });
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [pdfUrl]);

  return state;
}
