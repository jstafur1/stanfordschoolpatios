"use client";

import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";

type DocxViewerProps = {
  streamUrl: string;
};

export function DocxViewer({ streamUrl }: DocxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const target = containerRef.current;
      if (!target) return;

      setLoading(true);
      setError(null);
      target.innerHTML = "";

      try {
        const response = await fetch(streamUrl);
        if (!response.ok) throw new Error("Failed to load document");
        const blob = await response.blob();
        if (cancelled) return;
        await renderAsync(blob, target, undefined, {
          className: "docx-preview",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render document",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [streamUrl]);

  if (error) {
    return (
      <p className="rounded-xl border border-border p-8 text-center text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="relative min-h-[60vh] overflow-auto rounded-xl border border-border bg-background p-4">
      {loading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Loading document…
        </p>
      ) : null}
      <div ref={containerRef} className="docx-viewer" />
    </div>
  );
}
