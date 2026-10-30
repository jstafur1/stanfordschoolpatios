"use client";

import { useEffect, useRef, useState } from "react";
import { init } from "pptx-preview";

type PowerpointViewerProps = {
  streamUrl: string;
};

export function PowerpointViewer({ streamUrl }: PowerpointViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let previewer: ReturnType<typeof init> | null = null;

    async function load() {
      const target = containerRef.current;
      if (!target) return;

      setLoading(true);
      setError(null);
      target.innerHTML = "";

      try {
        const response = await fetch(streamUrl);
        if (!response.ok) throw new Error("Failed to load presentation");
        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        previewer = init(target, {
          width: Math.min(target.clientWidth || 960, 960),
          height: 540,
          mode: "list",
        });
        await previewer.preview(buffer);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to render presentation",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      previewer?.destroy();
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
          Loading presentation…
        </p>
      ) : null}
      <div ref={containerRef} className="pptx-viewer" />
    </div>
  );
}
