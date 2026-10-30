"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { submitGradeAction } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExamAnswer, ExamQuestion, ExamQuestionOption } from "@/lib/supabase/mappers";

type ReviewItem = {
  question: ExamQuestion;
  options: ExamQuestionOption[];
  answer: ExamAnswer | null;
};

type AttemptReviewPanelProps = {
  courseId: string;
  attemptId: string;
  items: ReviewItem[];
};

export function AttemptReviewPanel({
  courseId,
  attemptId,
  items,
}: AttemptReviewPanelProps) {
  const t = useTranslations("app.teacher.grades");
  const tc = useTranslations("app.common");
  const [pending, startTransition] = useTransition();

  function answerLabel(
    question: ExamQuestion,
    options: ExamQuestionOption[],
    answer: ExamAnswer | null,
  ) {
    if (!answer) return t("noAnswer");

    if (question.questionType === "open") {
      return answer.openText ?? tc("dash");
    }

    const selected = new Set(answer.selectedOptionIds ?? []);
    const labels = options
      .filter((option) => selected.has(option.id))
      .map((option) => option.text);

    return labels.length ? labels.join(", ") : tc("dash");
  }

  function statusBadge(
    question: ExamQuestion,
    answer: ExamAnswer | null,
  ) {
    if (!answer) {
      return <Badge variant="secondary">{t("noAnswer")}</Badge>;
    }

    if (question.questionType === "open" && answer.reviewedAt == null) {
      return (
        <Badge variant="secondary">
          {t("pending", { count: "" }).replace(/\s*\(\)/, "")}
        </Badge>
      );
    }

    if (answer.isCorrect === true) {
      return <Badge>{t("correct")}</Badge>;
    }

    if (answer.isCorrect === false) {
      return <Badge variant="destructive">{t("incorrect")}</Badge>;
    }

    return <Badge variant="secondary">{tc("dash")}</Badge>;
  }

  function grade(answerId: string, isCorrect: boolean) {
    startTransition(async () => {
      const result = await submitGradeAction(
        answerId,
        courseId,
        isCorrect,
        attemptId,
      );
      if (result.ok) {
        toast.success(
          isCorrect ? t("markedCorrect") : t("markedIncorrect"),
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border">
      {items.map(({ question, options, answer }) => (
        <li key={question.id} className="px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{question.text}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tc(`questionTypes.${question.questionType}`)}
              </p>
              <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
                {answerLabel(question, options, answer)}
              </p>
              {question.questionType !== "open" && options.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {options.map((option) => (
                    <li key={option.id}>
                      {option.text}
                      {option.isCorrect ? ` · ${t("correct").toLowerCase()}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              {statusBadge(question, answer)}
              {question.questionType === "open" &&
              answer &&
              answer.reviewedAt == null ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => grade(answer.id, false)}
                  >
                    {t("incorrect")}
                  </Button>
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => grade(answer.id, true)}
                  >
                    {t("correct")}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </li>
      ))}
      {items.length === 0 && (
        <li className="px-4 py-8 text-center text-sm text-muted-foreground">
          {t("noAttempts")}
        </li>
      )}
    </ul>
  );
}
