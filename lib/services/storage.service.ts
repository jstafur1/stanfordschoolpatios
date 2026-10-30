import "server-only";
import { getSupabase } from "@/lib/supabase/server-query";

export const COURSES_BUCKET = "courses";
export const AVATARS_BUCKET = "avatars";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function buildCourseContentPath(
  courseId: string,
  contentId: string,
  filename: string,
) {
  return `${courseId}/${contentId}/${sanitizeFilename(filename)}`;
}

export function sanitizeFilename(filename: string) {
  const base = filename.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\-() ]+/g, "_").trim();
  return cleaned || "file";
}

export async function uploadCourseContentFile(
  courseId: string,
  contentId: string,
  file: File,
) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File must be 50 MB or smaller");
  }

  const path = buildCourseContentPath(courseId, contentId, file.name);
  const supabase = await getSupabase();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(COURSES_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) throw new Error(error.message);
  return path;
}

export async function deleteCourseContentFile(storagePath: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.storage
    .from(COURSES_BUCKET)
    .remove([storagePath]);

  if (error) throw new Error(error.message);
}

export async function getSignedDownloadUrl(
  storagePath: string,
  expiresInSeconds = 3600,
) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.storage
    .from(COURSES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function resolveContentDownloadUrls<
  T extends { storagePath: string | null },
>(items: T[]) {
  const results = await Promise.all(
    items.map(async (item) => {
      if (!item.storagePath) {
        return { ...item, downloadUrl: null as string | null };
      }
      try {
        const downloadUrl = await getSignedDownloadUrl(item.storagePath);
        return { ...item, downloadUrl };
      } catch {
        return { ...item, downloadUrl: null as string | null };
      }
    }),
  );
  return results;
}

function avatarExtension(file: File) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export function buildAvatarPath(userId: string, file: File) {
  return `${userId}/avatar.${avatarExtension(file)}`;
}

export function getPublicStorageUrl(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export async function uploadAvatarFile(userId: string, file: File) {
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Avatar must be 2 MB or smaller");
  }

  if (!AVATAR_TYPES.has(file.type)) {
    throw new Error("Avatar must be JPG, PNG, WebP, or GIF");
  }

  const path = buildAvatarPath(userId, file);
  const supabase = await getSupabase();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) throw new Error(error.message);
  return getPublicStorageUrl(AVATARS_BUCKET, path);
}

export async function deleteAvatarFile(avatarUrl: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !avatarUrl.startsWith(base)) return;

  const prefix = `${base}/storage/v1/object/public/${AVATARS_BUCKET}/`;
  if (!avatarUrl.startsWith(prefix)) return;

  const path = avatarUrl.slice(prefix.length);
  const supabase = await getSupabase();
  const { error } = await supabase.storage.from(AVATARS_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
