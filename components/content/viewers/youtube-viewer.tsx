"use client";

import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { parseYoutubeVideoId } from "@/lib/content/youtube";

type YoutubeViewerProps = {
  url: string;
  title: string;
};

export function YoutubeViewer({ url, title }: YoutubeViewerProps) {
  const videoId = parseYoutubeVideoId(url);

  if (!videoId) {
    return (
      <p className="text-sm text-muted-foreground">
        Invalid YouTube URL.
      </p>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
      <LiteYouTubeEmbed
        id={videoId}
        title={title}
        alwaysLoadIframe
        cookie
        params={{ controls: 1, rel: 0, modestbranding: 1 }}
        iframeClass="size-full"
        wrapperClass="yt-lite w-full h-full"
      />
    </div>
  );
}
