import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabase } from "@/lib/supabase/server-query";
import { sanitizeFilename } from "@/lib/services/storage.service";

export const JOB_APPLICATIONS_BUCKET = "job-applications";

const MAX_CV_BYTES = 10 * 1024 * 1024;

const ALLOWED_CV_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_CV_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export function buildJobApplicationCvPath(
  jobId: string,
  applicationId: string,
  filename: string,
) {
  return `${jobId}/${applicationId}/${sanitizeFilename(filename)}`;
}

function isAllowedCv(file: File): boolean {
  if (ALLOWED_CV_TYPES.has(file.type)) return true;
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? ALLOWED_CV_EXTENSIONS.has(ext) : false;
}

export async function uploadJobApplicationCv(
  jobId: string,
  applicationId: string,
  file: File,
) {
  if (file.size > MAX_CV_BYTES) {
    throw new Error("CV must be 10 MB or smaller");
  }
  if (!isAllowedCv(file)) {
    throw new Error("CV file type not allowed");
  }

  const path = buildJobApplicationCvPath(jobId, applicationId, file.name);
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(JOB_APPLICATIONS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) throw new Error(error.message);
  return path;
}

export async function deleteJobApplicationCv(storagePath: string) {
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(JOB_APPLICATIONS_BUCKET)
    .remove([storagePath]);

  if (error) throw new Error(error.message);
}

export async function getSignedCvUrl(
  storagePath: string,
  expiresInSeconds = 3600,
) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.storage
    .from(JOB_APPLICATIONS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
