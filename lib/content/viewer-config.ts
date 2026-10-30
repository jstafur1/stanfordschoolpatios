import { isYoutubeUrl } from "@/lib/content/youtube";
import type { CourseContent } from "@/lib/supabase/mappers";
import type { CourseRole } from "@/lib/platform/course-nav";

export type ViewerMode =
  | "youtube"
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "docx"
  | "excel"
  | "powerpoint"
  | "fallback";

export function getFileExtension(storagePath: string | null): string | null {
  if (!storagePath) return null;
  const name = storagePath.split("/").pop() ?? "";
  const dot = name.lastIndexOf(".");
  if (dot < 0) return null;
  return name.slice(dot + 1).toLowerCase();
}

export function resolveViewerMode(
  content: Pick<CourseContent, "contentType" | "storagePath" | "externalUrl">,
): ViewerMode {
  if (
    content.contentType === "youtube" ||
    (content.externalUrl && isYoutubeUrl(content.externalUrl))
  ) {
    return "youtube";
  }

  const ext = getFileExtension(content.storagePath);

  if (content.contentType === "pdf" || ext === "pdf") return "pdf";
  if (content.contentType === "image" || isImageExtension(ext)) return "image";
  if (content.contentType === "video" || isVideoExtension(ext)) return "video";
  if (content.contentType === "audio" || isAudioExtension(ext)) return "audio";
  if (
    content.contentType === "word" ||
    ext === "docx" ||
    ext === "doc"
  ) {
    return ext === "doc" ? "fallback" : "docx";
  }
  if (content.contentType === "excel" || ext === "xlsx" || ext === "xls") {
    return "excel";
  }
  if (
    content.contentType === "powerpoint" ||
    ext === "pptx" ||
    ext === "ppt"
  ) {
    return ext === "ppt" ? "fallback" : "powerpoint";
  }

  if (ext === "pdf") return "pdf";
  if (isImageExtension(ext)) return "image";
  if (isVideoExtension(ext)) return "video";
  if (isAudioExtension(ext)) return "audio";

  return "fallback";
}

function isImageExtension(ext: string | null): boolean {
  return (
    ext === "png" ||
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "webp" ||
    ext === "gif"
  );
}

function isVideoExtension(ext: string | null): boolean {
  return ext === "mp4" || ext === "webm" || ext === "mov";
}

function isAudioExtension(ext: string | null): boolean {
  return (
    ext === "mp3" ||
    ext === "wav" ||
    ext === "m4a" ||
    ext === "ogg" ||
    ext === "aac"
  );
}

export function getContentViewerPath(
  role: CourseRole,
  courseId: string,
  contentId: string,
): string {
  return `/${role}/courses/${courseId}/content/${contentId}`;
}

export function getContentStreamUrl(
  courseId: string,
  contentId: string,
  disposition: "inline" | "attachment" = "inline",
): string {
  return `/api/courses/${courseId}/content/${contentId}/stream?disposition=${disposition}`;
}

export function guessMimeType(
  storagePath: string | null,
  contentType: string,
): string {
  const ext = getFileExtension(storagePath);
  const byExt: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ppt: "application/vnd.ms-powerpoint",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    aac: "audio/aac",
  };

  if (ext && byExt[ext]) return byExt[ext];

  switch (contentType) {
    case "pdf":
      return "application/pdf";
    case "image":
      return "image/jpeg";
    case "video":
      return "video/mp4";
    case "audio":
      return "audio/mpeg";
    case "word":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "excel":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "powerpoint":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    default:
      return "application/octet-stream";
  }
}

export function getDownloadFilename(
  title: string,
  storagePath: string | null,
): string {
  const ext = getFileExtension(storagePath);
  if (!ext) return title;
  const safeTitle = title.replace(/[^\w.\-() ]+/g, "_").trim() || "file";
  if (safeTitle.toLowerCase().endsWith(`.${ext}`)) return safeTitle;
  return `${safeTitle}.${ext}`;
}
