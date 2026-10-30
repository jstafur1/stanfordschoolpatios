import type { ActionErrorCode } from "@/lib/errors/codes";
import {
  AppActionError,
  mapErrorToCode,
} from "@/lib/errors/action-error";

export type ActionFailure = {
  ok: false;
  code: ActionErrorCode;
  /** @deprecated Use code with app.errors translations on the client */
  error?: string;
};

export type ActionResult = { ok: true } | ActionFailure;

export function actionError(error: unknown): ActionFailure {
  if (error instanceof AppActionError) {
    return { ok: false, code: error.code };
  }
  if (error instanceof Error) {
    return {
      ok: false,
      code: mapErrorToCode(error.message),
      error: error.message,
    };
  }
  return { ok: false, code: "generic" };
}

export function actionFail(code: ActionErrorCode): ActionFailure {
  return { ok: false, code };
}
