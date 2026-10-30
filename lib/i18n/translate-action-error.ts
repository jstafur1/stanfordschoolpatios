import type { ActionFailure } from "@/lib/actions/result";
import type { ActionErrorCode } from "@/lib/errors/codes";

export function translateActionError(
  result: ActionFailure,
  t: (key: ActionErrorCode, values?: Record<string, string | number>) => string,
  values?: Record<string, string | number>,
): string {
  try {
    return t(result.code, values);
  } catch {
    return result.error ?? t("generic");
  }
}
