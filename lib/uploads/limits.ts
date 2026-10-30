/** Matches server-side limits in lib/services/storage.service.ts */
export const MAX_COURSE_CONTENT_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_JOB_CV_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_AVATAR_FILE_BYTES = 2 * 1024 * 1024;

export function getFormFile(
  form: HTMLFormElement,
  name: string,
): File | null {
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLInputElement && field.files?.[0]) {
    const file = field.files[0];
    if (file.size > 0) return file;
  }
  return null;
}

export function isFileWithinLimit(file: File, maxBytes: number): boolean {
  return file.size <= maxBytes;
}
