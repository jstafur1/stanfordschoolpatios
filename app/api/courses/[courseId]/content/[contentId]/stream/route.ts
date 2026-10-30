import { getCurrentProfile } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/roles";
import { assertCanViewContent } from "@/lib/content/content-access";
import {
  getDownloadFilename,
  guessMimeType,
} from "@/lib/content/viewer-config";
import { COURSES_BUCKET } from "@/lib/services/storage.service";
import { getSupabase } from "@/lib/supabase/server-query";

type RouteContext = {
  params: Promise<{ courseId: string; contentId: string }>;
};

function parseByteRange(
  rangeHeader: string,
  size: number,
): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return null;

  const [, startPart, endPart] = match;
  let start = startPart ? Number.parseInt(startPart, 10) : NaN;
  let end = endPart ? Number.parseInt(endPart, 10) : NaN;

  if (startPart === "" && endPart !== "") {
    const suffixLength = end;
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    if (!Number.isFinite(start) || start < 0) return null;
    if (!endPart) {
      end = size - 1;
    } else if (!Number.isFinite(end) || end < start) {
      return null;
    }
  }

  if (start >= size) return null;
  end = Math.min(end, size - 1);

  return { start, end };
}

export async function GET(request: Request, context: RouteContext) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { courseId, contentId } = await context.params;
  const { searchParams } = new URL(request.url);
  const dispositionParam = searchParams.get("disposition");
  const disposition =
    dispositionParam === "attachment" ? "attachment" : "inline";

  let content;
  try {
    content = await assertCanViewContent(
      profile.id,
      profile.role as UserRole,
      courseId,
      contentId,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message === "Content not found" ? 404 : 403;
    return new Response(message, { status });
  }

  if (!content.storagePath) {
    return new Response("No file for this content item", { status: 404 });
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase.storage
    .from(COURSES_BUCKET)
    .download(content.storagePath);

  if (error || !data) {
    return new Response(error?.message ?? "File not found", { status: 404 });
  }

  const mimeType = guessMimeType(content.storagePath, content.contentType);
  const filename = getDownloadFilename(content.title, content.storagePath);
  const buffer = Buffer.from(await data.arrayBuffer());
  const total = buffer.length;

  const commonHeaders = {
    "Content-Type": mimeType,
    "Content-Disposition": `${disposition}; filename="${encodeURIComponent(filename)}"`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  };

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const range = parseByteRange(rangeHeader, total);
    if (!range) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: {
          ...commonHeaders,
          "Content-Range": `bytes */${total}`,
        },
      });
    }

    const chunk = buffer.subarray(range.start, range.end + 1);
    return new Response(chunk, {
      status: 206,
      headers: {
        ...commonHeaders,
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${range.start}-${range.end}/${total}`,
      },
    });
  }

  return new Response(buffer, {
    status: 200,
    headers: {
      ...commonHeaders,
      "Content-Length": String(total),
    },
  });
}
