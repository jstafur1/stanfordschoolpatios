"use client";

import { useCallback, useRef } from "react";
import type { Exam, ExamAnswer } from "@/lib/supabase/mappers";
import { ExamTakeForm } from "./exam-take-form";
import { ExamTimer } from "./exam-timer";

type StudentQuestion = {
  question: {
    id: string;
    questionType: string;
    text: string;
    sortOrder: number;
  };
  options: Array<{
    id: string;
    text: string;
  }>;
};

type ExamTakeShellProps = {
  courseId: string;
  exam: Exam;
  attemptId: string;
  startedAt: string;
  questions: StudentQuestion[];
  answers: ExamAnswer[];
};

export function ExamTakeShell({
  courseId,
  exam,
  attemptId,
  startedAt,
  questions,
  answers,
}: ExamTakeShellProps) {
  const submitFormRef = useRef<HTMLFormElement>(null);
  const timerExpiredRef = useRef(false);

  const handleExpire = useCallback(() => {
    timerExpiredRef.current = true;
    submitFormRef.current?.requestSubmit();
  }, []);

  return (
    <div className="space-y-6">
      {exam.timeLimitMinutes ? (
        <ExamTimer
          startedAt={startedAt}
          timeLimitMinutes={exam.timeLimitMinutes}
          onExpire={handleExpire}
        />
      ) : null}
      <ExamTakeForm
        courseId={courseId}
        exam={exam}
        attemptId={attemptId}
        questions={questions}
        answers={answers}
        submitFormRef={submitFormRef}
        timerExpiredRef={timerExpiredRef}
      />
    </div>
  );
}
