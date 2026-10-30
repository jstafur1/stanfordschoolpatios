"use client";

type VideoViewerProps = {
  streamUrl: string;
  mimeType: string;
  title: string;
};

export function VideoViewer({ streamUrl, mimeType, title }: VideoViewerProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black">
      <video
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full"
        title={title}
      >
        <source src={streamUrl} type={mimeType} />
        Your browser does not support video playback.
      </video>
    </div>
  );
}
