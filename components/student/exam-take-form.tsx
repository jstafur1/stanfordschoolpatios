"use client";

import type { RefObject } from "react";
import { SaveAnswerForm } from "@/components/student/save-answer-form";
import { ExamSubmitSection } from "@/components/student/exam-submit-section";
import type { Exam, ExamAnswer } from "@/lib/supabase/mappers";

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

type ExamTakeFormProps = {
  courseId: string;
  exam: Exam;
  attemptId: string;
  questions: StudentQuestion[];
  answers: ExamAnswer[];
  submitFormRef?: RefObject<HTMLFormElement | null>;
  timerExpiredRef?: RefObject<boolean>;
};

export function ExamTakeForm({
  courseId,
  exam,
  attemptId,
  questions,
  answers,
  submitFormRef,
  timerExpiredRef,
}: ExamTakeFormProps) {
  const answersByQuestion = new Map(
    answers.map((answer) => [answer.questionId, answer]),
  );

  return (
    <div className="space-y-8">
      {questions.map(({ question, options }) => (
        <SaveAnswerForm
          key={question.id}
          courseId={courseId}
          examId={exam.id}
          attemptId={attemptId}
          questionId={question.id}
          questionType={question.questionType}
          questionText={question.text}
          options={options}
          saved={answersByQuestion.get(question.id)}
        />
      ))}

      <ExamSubmitSection
        courseId={courseId}
        examId={exam.id}
        attemptId={attemptId}
        questions={questions.map(({ question }) => question)}
        answers={answers}
        submitFormRef={submitFormRef}
        timerExpiredRef={timerExpiredRef}
      />
    </div>
  );
}
