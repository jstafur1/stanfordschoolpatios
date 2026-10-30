export type CompletionStatus =
  | "in_progress"
  | "pending_review"
  | "passed"
  | "failed";

export type AttemptStatus =
  | "in_progress"
  | "pending_review"
  | "passed"
  | "failed"
  | "submitted";

type StatusTranslator = (key: string) => string;

export function translateCompletionStatus(
  status: string,
  t: StatusTranslator,
): string {
  const key = `completionStatus.${status}`;
  try {
    return t(key);
  } catch {
    return status.replace(/_/g, " ");
  }
}

export function translateAttemptStatus(
  status: string,
  t: StatusTranslator,
): string {
  if (status === "submitted") {
    try {
      return t("attemptStatus.submitted");
    } catch {
      return status;
    }
  }
  return translateCompletionStatus(status, t);
}
