"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type ExcelViewerProps = {
  streamUrl: string;
};

export function ExcelViewer({ streamUrl }: ExcelViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(streamUrl);
        if (!response.ok) throw new Error("Failed to load spreadsheet");
        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) {
          setHtml("<p>No sheets found.</p>");
          return;
        }

        const sheet = workbook.Sheets[firstSheet];
        const tableHtml = XLSX.utils.sheet_to_html(sheet, { editable: false });
        setHtml(tableHtml);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render spreadsheet",
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

  if (loading) {
    return (
      <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
        Loading spreadsheet…
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-border p-8 text-center text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div
      className="excel-viewer min-h-[60vh] overflow-auto rounded-xl border border-border bg-background p-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1"
      dangerouslySetInnerHTML={{ __html: html ?? "" }}
    />
  );
}
