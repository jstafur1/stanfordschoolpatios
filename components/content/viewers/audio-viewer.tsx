"use client";

type AudioViewerProps = {
  streamUrl: string;
  mimeType: string;
  title: string;
};

export function AudioViewer({ streamUrl, mimeType, title }: AudioViewerProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-6">
      <audio controls preload="metadata" className="w-full" title={title}>
        <source src={streamUrl} type={mimeType} />
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}
