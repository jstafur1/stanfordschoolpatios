"use client";

import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { submitExamFormAction } from "@/app/actions/student";
import { Button } from "@/components/ui/button";
import type { ExamAnswer } from "@/lib/supabase/mappers";

type QuestionRef = {
  id: string;
  questionType: string;
};

type ExamSubmitSectionProps = {
  courseId: string;
  examId: string;
  attemptId: string;
  questions: QuestionRef[];
  answers: ExamAnswer[];
  submitFormRef?: React.RefObject<HTMLFormElement | null>;
  timerExpiredRef?: React.RefObject<boolean>;
};

function isAnswered(question: QuestionRef, answers: ExamAnswer[]) {
  const answer = answers.find((entry) => entry.questionId === question.id);
  if (!answer) return false;
  if (question.questionType === "open") {
    return Boolean(answer.openText?.trim());
  }
  return (answer.selectedOptionIds?.length ?? 0) > 0;
}

export function ExamSubmitSection({
  courseId,
  examId,
  attemptId,
  questions,
  answers,
  submitFormRef,
  timerExpiredRef,
}: ExamSubmitSectionProps) {
  const t = useTranslations("app.student.exams");
  const forceSubmitRef = useRef(false);
  const skipInputRef = useRef<HTMLInputElement>(null);
  const internalRef = useRef<HTMLFormElement>(null);
  const formRef = submitFormRef ?? internalRef;

  const unansweredCount = useMemo(
    () => questions.filter((question) => !isAnswered(question, answers)).length,
    [questions, answers],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (timerExpiredRef?.current || forceSubmitRef.current) {
      if (skipInputRef.current) skipInputRef.current.value = "on";
      forceSubmitRef.current = false;
      if (timerExpiredRef) timerExpiredRef.current = false;
      return;
    }

    if (unansweredCount > 0) {
      event.preventDefault();
      const confirmed = window.confirm(
        t("confirmSubmit", { count: unansweredCount }),
      );
      if (confirmed) {
        forceSubmitRef.current = true;
        if (skipInputRef.current) skipInputRef.current.value = "on";
        formRef.current?.requestSubmit();
      }
    }
  }

  return (
    <form
      ref={formRef}
      action={submitExamFormAction}
      onSubmit={handleSubmit}
      className="space-y-2"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="examId" value={examId} />
      <input type="hidden" name="attemptId" value={attemptId} />
      <input
        ref={skipInputRef}
        type="hidden"
        name="skipUnansweredCheck"
        defaultValue=""
      />
      {unansweredCount > 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          {t("unansweredWarning", { count: unansweredCount })}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t("allAnswered")}</p>
      )}
      <Button type="submit">{t("submitExam")}</Button>
    </form>
  );
}
