"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FallbackViewer } from "@/components/content/viewers/fallback-viewer";
import {
  getContentStreamUrl,
  guessMimeType,
  resolveViewerMode,
  type ViewerMode,
} from "@/lib/content/viewer-config";
import type { CourseContent } from "@/lib/supabase/mappers";
import type { CourseRole } from "@/lib/platform/course-nav";

const PdfViewer = dynamic(
  () =>
    import("@/components/content/viewers/pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => <ViewerLoading />,
  },
);

const YoutubeViewer = dynamic(
  () =>
    import("@/components/content/viewers/youtube-viewer").then(
      (mod) => mod.YoutubeViewer,
    ),
  { ssr: false, loading: () => <ViewerLoading /> },
);

const ImageViewer = dynamic(
  () =>
    import("@/components/content/viewers/image-viewer").then(
      (mod) => mod.ImageViewer,
    ),
  { ssr: false, loading: () => <ViewerLoading /> },
);

const VideoViewer = dynamic(
  () =>
    import("@/components/content/viewers/video-viewer").then(
      (mod) => mod.VideoViewer,
    ),
  { ssr: false, loading: () => <ViewerLoading /> },
);

const DocxViewer = dynamic(
  () =>
    import("@/components/content/viewers/docx-viewer").then(
      (mod) => mod.DocxViewer,
    ),
  { ssr: false, loading: () => <ViewerLoading /> },
);

const ExcelViewer = dynamic(
  () =>
    import("@/components/content/viewers/excel-viewer").then(
      (mod) => mod.ExcelViewer,
    ),
  { ssr: false, loading: () => <ViewerLoading /> },
);

const AudioViewer = dynamic(
  () =>
    import("@/components/content/viewers/audio-viewer").then(
      (mod) => mod.AudioViewer,
    ),
  { ssr: false, loading: () => <ViewerLoading /> },
);

const PowerpointViewer = dynamic(
  () =>
    import("@/components/content/viewers/powerpoint-viewer").then(
      (mod) => mod.PowerpointViewer,
    ),
  { ssr: false, loading: () => <ViewerLoading /> },
);

function ViewerLoading() {
  return (
    <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
      Loading…
    </p>
  );
}

export type ContentViewerProps = {
  role: CourseRole;
  courseId: string;
  content: CourseContent;
  backHref: string;
  viewed?: boolean;
};

export function ContentViewer({
  role: _role,
  courseId,
  content,
  backHref,
  viewed = false,
}: ContentViewerProps) {
  void _role;
  const t = useTranslations("app.common.contentViewer");
  const tc = useTranslations("app.common");
  const mode = resolveViewerMode(content);
  const knownTypes = [
    "pdf",
    "youtube",
    "image",
    "excel",
    "word",
    "powerpoint",
    "video",
    "audio",
    "other",
  ] as const;
  const typeLabel = (knownTypes as readonly string[]).includes(
    content.contentType,
  )
    ? tc(`contentTypes.${content.contentType}` as "contentTypes.pdf")
    : content.contentType;
  const streamUrl = content.storagePath
    ? getContentStreamUrl(courseId, content.id, "inline")
    : null;
  const downloadUrl = content.storagePath
    ? getContentStreamUrl(courseId, content.id, "attachment")
    : null;
  const mimeType = guessMimeType(content.storagePath, content.contentType);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{content.title}</h1>
            {viewed ? (
              <Badge variant="secondary">{t("viewed")}</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{typeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={backHref}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("backToCourse")}
          </Link>
          {downloadUrl ? (
            <a
              href={downloadUrl}
              download
              className={cn(buttonVariants({ variant: "default" }), "gap-2")}
            >
              <Download className="size-4" />
              {t("download")}
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <ViewerBody
          mode={mode}
          content={content}
          streamUrl={streamUrl}
          downloadUrl={downloadUrl}
          mimeType={mimeType}
        />
      </div>
    </div>
  );
}

function ViewerBody({
  mode,
  content,
  streamUrl,
  downloadUrl,
  mimeType,
}: {
  mode: ViewerMode;
  content: CourseContent;
  streamUrl: string | null;
  downloadUrl: string | null;
  mimeType: string;
}) {
  switch (mode) {
    case "youtube":
      if (!content.externalUrl) {
        return <FallbackViewer downloadUrl={downloadUrl} />;
      }
      return <YoutubeViewer url={content.externalUrl} title={content.title} />;
    case "pdf":
      if (!streamUrl) return <FallbackViewer downloadUrl={downloadUrl} />;
      return <PdfViewer streamUrl={streamUrl} />;
    case "image":
      if (!streamUrl) return <FallbackViewer downloadUrl={downloadUrl} />;
      return <ImageViewer streamUrl={streamUrl} title={content.title} />;
    case "video":
      if (!streamUrl) return <FallbackViewer downloadUrl={downloadUrl} />;
      return (
        <VideoViewer
          streamUrl={streamUrl}
          mimeType={mimeType}
          title={content.title}
        />
      );
    case "audio":
      if (!streamUrl) return <FallbackViewer downloadUrl={downloadUrl} />;
      return (
        <AudioViewer
          streamUrl={streamUrl}
          mimeType={mimeType}
          title={content.title}
        />
      );
    case "docx":
      if (!streamUrl) return <FallbackViewer downloadUrl={downloadUrl} />;
      return <DocxViewer streamUrl={streamUrl} />;
    case "excel":
      if (!streamUrl) return <FallbackViewer downloadUrl={downloadUrl} />;
      return <ExcelViewer streamUrl={streamUrl} />;
    case "powerpoint":
      if (!streamUrl) return <FallbackViewer downloadUrl={downloadUrl} />;
      return <PowerpointViewer streamUrl={streamUrl} />;
    default:
      return <FallbackViewer downloadUrl={downloadUrl} />;
  }
}
