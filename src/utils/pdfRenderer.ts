import * as pdfjsLib from 'pdfjs-dist';

// Configure worker using CDN matching the installed pdfjs-dist version
if (typeof window !== 'undefined' && 'GlobalWorkerOptions' in pdfjsLib) {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface RenderedPdfPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Converts a PDF file into an array of image data URLs (one per page).
 * Supports progress callback for rendering large PDFs (e.g. 32 pages for a full class).
 */
export async function renderPdfToImages(
  file: File | Blob | ArrayBuffer,
  options?: {
    scale?: number;
    maxPages?: number;
    onProgress?: (current: number, total: number) => void;
  }
): Promise<RenderedPdfPage[]> {
  const scale = options?.scale || 1.5;
  let arrayBuffer: ArrayBuffer;

  if (file instanceof ArrayBuffer) {
    arrayBuffer = file;
  } else if (file instanceof Blob) {
    arrayBuffer = await file.arrayBuffer();
  } else {
    throw new Error('Format file tidak didukung');
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = options?.maxPages ? Math.min(options.maxPages, pdfDoc.numPages) : pdfDoc.numPages;
  const pages: RenderedPdfPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as any).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    pages.push({
      pageNumber: i,
      dataUrl,
      width: viewport.width,
      height: viewport.height,
    });

    if (options?.onProgress) {
      options.onProgress(i, numPages);
    }
  }

  return pages;
}
