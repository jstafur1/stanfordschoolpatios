"use client";

type ImageViewerProps = {
  streamUrl: string;
  title: string;
};

export function ImageViewer({ streamUrl, title }: ImageViewerProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center overflow-auto rounded-xl border border-border bg-muted/20 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={streamUrl}
        alt={title}
        className="max-h-[75vh] max-w-full rounded-lg object-contain"
      />
    </div>
  );
}
