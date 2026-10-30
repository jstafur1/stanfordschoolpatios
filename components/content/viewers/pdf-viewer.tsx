"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PdfViewerProps = {
  streamUrl: string;
};

export function PdfViewer({ streamUrl }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-24 text-center text-sm text-muted-foreground">
            {numPages > 0 ? `${pageNumber} / ${numPages}` : "—"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={pageNumber >= numPages}
            onClick={() =>
              setPageNumber((page) => Math.min(numPages, page + 1))
            }
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={scale <= 0.5}
            onClick={() => setScale((value) => Math.max(0.5, value - 0.1))}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-12 text-center text-sm text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={scale >= 2}
            onClick={() => setScale((value) => Math.min(2, value + 0.1))}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "overflow-auto rounded-xl border border-border bg-muted/30 p-4",
          "min-h-[60vh]",
        )}
      >
        <Document
          file={streamUrl}
          onLoadSuccess={({ numPages: total }) => {
            setNumPages(total);
            setPageNumber(1);
          }}
          loading={
            <p className="p-8 text-center text-sm text-muted-foreground">
              Loading PDF…
            </p>
          }
          error={
            <p className="p-8 text-center text-sm text-destructive">
              Failed to load PDF.
            </p>
          }
          className="flex justify-center"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  );
}
