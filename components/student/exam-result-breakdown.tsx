"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ExamAnswer, ExamQuestion } from "@/lib/supabase/mappers";

type ResultItem = {
  question: ExamQuestion;
  answer: ExamAnswer | null;
  answerText: string;
  correctAnswerText?: string | null;
};

type ExamResultBreakdownProps = {
  items: ResultItem[];
  attemptStatus: string;
};

export function ExamResultBreakdown({
  items,
  attemptStatus,
}: ExamResultBreakdownProps) {
  const t = useTranslations("app.student.exams");
  const tc = useTranslations("app.common");
  const showCorrectAnswers = attemptStatus !== "pending_review";

  function statusBadge(question: ExamQuestion, answer: ExamAnswer | null) {
    if (!answer) {
      return <Badge variant="secondary">{t("unanswered")}</Badge>;
    }

    if (question.questionType === "open" && answer.reviewedAt == null) {
      return <Badge variant="secondary">{t("pendingReview")}</Badge>;
    }

    if (answer.isCorrect === true) {
      return <Badge>{t("correct")}</Badge>;
    }

    if (answer.isCorrect === false) {
      return <Badge variant="destructive">{t("incorrect")}</Badge>;
    }

    return <Badge variant="secondary">{tc("dash")}</Badge>;
  }

  return (
    <ul className="mt-8 divide-y divide-border rounded-2xl border border-border">
      {items.map(({ question, answer, answerText, correctAnswerText }) => (
        <li key={question.id} className="px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{question.text}</p>
              <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">
                {answerText}
              </p>
              {showCorrectAnswers &&
              correctAnswerText &&
              answer?.isCorrect === false ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("correctAnswer", { answer: correctAnswerText })}
                </p>
              ) : null}
            </div>
            {statusBadge(question, answer)}
          </div>
        </li>
      ))}
      {items.length === 0 && (
        <li className="px-4 py-8 text-center text-sm text-muted-foreground">
          {t("noQuestions")}
        </li>
      )}
    </ul>
  );
}
