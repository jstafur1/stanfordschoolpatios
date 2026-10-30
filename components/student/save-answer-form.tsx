"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { saveExamAnswerAction } from "@/app/actions/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/actions/result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import type { ExamAnswer } from "@/lib/supabase/mappers";

type SaveAnswerFormProps = {
  courseId: string;
  examId: string;
  attemptId: string;
  questionId: string;
  questionType: string;
  questionText: string;
  options: Array<{ id: string; text: string }>;
  saved?: ExamAnswer;
};

const initialState: ActionResult | null = null;

export function SaveAnswerForm({
  courseId,
  examId,
  attemptId,
  questionId,
  questionType,
  questionText,
  options,
  saved,
}: SaveAnswerFormProps) {
  const t = useTranslations("app.student.exams");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const [state, formAction, pending] = useActionState(
    saveExamAnswerAction,
    initialState,
  );
  const selected = new Set(saved?.selectedOptionIds ?? []);
  const isSaved = saved
    ? questionType === "open"
      ? Boolean(saved.openText?.trim())
      : (saved.selectedOptionIds?.length ?? 0) > 0
    : false;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(t("answerSaved"));
    } else {
      toast.error(translateActionError(state, te));
    }
  }, [state, t, te]);

  return (
    <section className="rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold">{questionText}</h2>
        {isSaved ? (
          <span className="text-xs text-muted-foreground">{t("saved")}</span>
        ) : null}
      </div>

      <form action={formAction} className="mt-4 grid gap-3">
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="examId" value={examId} />
        <input type="hidden" name="attemptId" value={attemptId} />
        <input type="hidden" name="questionId" value={questionId} />
        <input type="hidden" name="questionType" value={questionType} />

        {questionType === "open" ? (
          <div className="grid gap-2">
            <Label htmlFor={`open-${questionId}`}>{t("yourAnswer")}</Label>
            <Input
              id={`open-${questionId}`}
              name="openText"
              defaultValue={saved?.openText ?? ""}
              required
            />
          </div>
        ) : (
          <ul className="grid gap-2">
            {options.map((option) => (
              <li key={option.id}>
                <label className="flex items-center gap-2 text-sm">
                  {questionType === "multiple_choice" ? (
                    <>
                      <input
                        type="checkbox"
                        name="selectedOptionIds"
                        value={option.id}
                        defaultChecked={selected.has(option.id)}
                        className="size-4 rounded border border-input"
                      />
                      {option.text}
                    </>
                  ) : (
                    <>
                      <input
                        type="radio"
                        name="selectedOptionIds"
                        value={option.id}
                        defaultChecked={selected.has(option.id)}
                        className="size-4"
                      />
                      {option.text}
                    </>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}

        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? tc("saving") : t("saveAnswer")}
        </Button>
      </form>
    </section>
  );
}
