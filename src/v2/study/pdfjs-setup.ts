/* pdf.js 워커 self-host (Vite ?url). CDN/CSP 회피. 한 번만 import되면 됨. */
import { GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;
