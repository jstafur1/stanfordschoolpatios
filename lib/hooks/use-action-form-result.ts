"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionFailure, ActionResult } from "@/lib/actions/result";

type UseActionFormResultOptions = {
  onSuccess?: () => void;
  onError?: (result: ActionFailure) => void;
};

export function useActionFormResult(
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>,
  { onSuccess, onError }: UseActionFormResultOptions,
) {
  const [state, formAction, pending] = useActionState(action, null);
  const lastHandled = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!state || state === lastHandled.current) return;
    lastHandled.current = state;
    if (state.ok) {
      onSuccess?.();
    } else {
      onError?.(state);
    }
  }, [state, onSuccess, onError]);

  return { state, formAction, pending };
}
