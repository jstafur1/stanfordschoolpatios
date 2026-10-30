"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { submitGradeAction } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";

type PendingItem = {
  answer: { id: string; openText: string | null };
  question: { text: string };
  exam: { title: string };
  attempt: { id: string };
  studentName: string;
};

type PendingReviewListProps = {
  courseId: string;
  items: PendingItem[];
};

export function PendingReviewList({ courseId, items }: PendingReviewListProps) {
  const t = useTranslations("app.teacher.grades");
  const tc = useTranslations("app.common");
  const [pending, startTransition] = useTransition();

  function grade(
    answerId: string,
    attemptId: string,
    isCorrect: boolean,
  ) {
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
      {items.map((item) => (
        <li key={item.answer.id} className="px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{item.exam.title}</p>
              <p className="text-xs text-muted-foreground">{item.studentName}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.question.text}
              </p>
              <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">
                {item.answer.openText ?? tc("dash")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => grade(item.answer.id, item.attempt.id, false)}
              >
                {t("incorrect")}
              </Button>
              <Button
                size="sm"
                disabled={pending}
                onClick={() => grade(item.answer.id, item.attempt.id, true)}
              >
                {t("correct")}
              </Button>
            </div>
          </div>
        </li>
      ))}
      {items.length === 0 && (
        <li className="px-4 py-6 text-center text-sm text-muted-foreground">
          {t("nothingPending")}
        </li>
      )}
    </ul>
  );
}
