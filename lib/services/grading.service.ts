import "server-only";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import {
  mapExam,
  mapExamAnswer,
  type ExamAnswerRow,
  mapExamAttempt,
  mapExamQuestion,
  mapExamQuestionOption,
} from "@/lib/supabase/mappers";
import { canGradeAttempt, canManageCourse } from "@/lib/permissions/courses";
import { syncEnrollmentCompletion } from "@/lib/services/completion.service";
import { recordAuditEvent } from "@/lib/services/audit.service";

export async function listPendingOpenAnswers(courseId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listPendingOpenAnswers",
    await supabase
      .from("exam_answers")
      .select(
        `
        *,
        exam_attempts!inner (
          *,
          exams!inner (*),
          profiles:student_id (full_name)
        ),
        exam_questions!inner (*)
      `,
      )
      .eq("exam_attempts.exams.course_id", courseId)
      .eq("exam_attempts.status", "pending_review")
      .eq("exam_questions.question_type", "open")
      .is("reviewed_at", null),
  );

  return data.map((row) => {
    const attemptRow = Array.isArray(row.exam_attempts)
      ? row.exam_attempts[0]
      : row.exam_attempts;
    if (!attemptRow) {
      throw new Error("listPendingOpenAnswers: missing attempt");
    }
    const examRow = Array.isArray(attemptRow.exams)
      ? attemptRow.exams[0]
      : attemptRow.exams;
    if (!examRow) {
      throw new Error("listPendingOpenAnswers: missing exam");
    }
    const questionRow = Array.isArray(row.exam_questions)
      ? row.exam_questions[0]
      : row.exam_questions;
    if (!questionRow) {
      throw new Error("listPendingOpenAnswers: missing question");
    }

    const profileRow = Array.isArray(attemptRow.profiles)
      ? attemptRow.profiles[0]
      : attemptRow.profiles;

    return {
      answer: mapExamAnswer(row),
      question: mapExamQuestion(questionRow),
      attempt: mapExamAttempt(attemptRow),
      exam: mapExam(examRow),
      studentName: profileRow?.full_name ?? "Unknown student",
    };
  });
}

export async function submitGrade(
  userId: string,
  role: string,
  answerId: string,
  isCorrect: boolean,
) {
  const supabase = await getSupabase();
  const { data: answer, error: fetchError } = await supabase
    .from("exam_answers")
    .select("attempt_id")
    .eq("id", answerId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!answer) throw new Error("Answer not found");

  const allowed = await canGradeAttempt(userId, role, answer.attempt_id);
  if (!allowed) throw new Error("Forbidden");

  const data = throwOnError<ExamAnswerRow>(
    "submitGrade",
    await supabase
      .from("exam_answers")
      .update({
        is_correct: isCorrect,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq("id", answerId)
      .select()
      .single(),
  );

  const { data: attemptMeta } = await supabase
    .from("exam_attempts")
    .select("exam_id, exams(course_id)")
    .eq("id", answer.attempt_id)
    .maybeSingle();

  const examsNested = attemptMeta?.exams as
    | { course_id: string }
    | { course_id: string }[]
    | null
    | undefined;
  const courseId = Array.isArray(examsNested)
    ? examsNested[0]?.course_id
    : examsNested?.course_id;

  if (courseId) {
    await recordAuditEvent({
      eventType: "exam_answer_graded",
      actorId: userId,
      targetType: "exam_answer",
      targetId: answerId,
      courseId: courseId as string,
      metadata: { isCorrect, attemptId: answer.attempt_id },
    });
  }

  await tryFinalizeAttempt(answer.attempt_id, userId);
  return {
    answer: mapExamAnswer(data),
    examId: attemptMeta?.exam_id ?? null,
  };
}

export async function tryFinalizeAttempt(attemptId: string, actorId?: string) {
  const supabase = await getSupabase();

  const { data: attempt, error: attemptError } = await supabase
    .from("exam_attempts")
    .select("*, exams(*)")
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptError) throw new Error(attemptError.message);
  if (!attempt) throw new Error("Attempt not found");

  if (
    attempt.status !== "submitted" &&
    attempt.status !== "pending_review"
  ) {
    return mapExamAttempt(attempt);
  }

  const examRow = Array.isArray(attempt.exams)
    ? attempt.exams[0]
    : attempt.exams;
  if (!examRow) throw new Error("Missing exam for attempt");

  const answers = throwOnError(
    "finalizeAttemptAnswers",
    await supabase.from("exam_answers").select("*").eq("attempt_id", attemptId),
  );

  const questions = throwOnError(
    "finalizeAttemptQuestions",
    await supabase
      .from("exam_questions")
      .select("id, question_type")
      .eq("exam_id", attempt.exam_id),
  );

  const questionIds = new Set(questions.map((question) => question.id));
  const relevantAnswers = answers.filter((answer) =>
    questionIds.has(answer.question_id),
  );

  const hasUnreviewedOpen = relevantAnswers.some((answer) => {
    const question = questions.find((q) => q.id === answer.question_id);
    return question?.question_type === "open" && answer.reviewed_at == null;
  });

  if (hasUnreviewedOpen) {
    if (attempt.status !== "pending_review") {
      assertNoError(
        "setPendingReview",
        await supabase
          .from("exam_attempts")
          .update({ status: "pending_review" })
          .eq("id", attemptId),
      );
    }
    await syncEnrollmentCompletion(
      attempt.student_id,
      examRow.course_id,
      actorId ?? attempt.student_id,
    );
    return mapExamAttempt(attempt);
  }

  const gradable = relevantAnswers.filter((answer) => {
    const question = questions.find((q) => q.id === answer.question_id);
    return question?.question_type !== "open" || answer.reviewed_at != null;
  });

  const correctCount = gradable.filter((answer) => answer.is_correct).length;
  const total = questions.length;
  const scorePercent =
    total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const threshold = examRow.pass_threshold_percent;
  let status: "passed" | "failed" | "submitted" = "submitted";
  if (threshold != null) {
    status = scorePercent >= threshold ? "passed" : "failed";
  }

  const { data: updated, error } = await supabase
    .from("exam_attempts")
    .update({
      status,
      score_percent: scorePercent,
      submitted_at: attempt.submitted_at ?? new Date().toISOString(),
    })
    .eq("id", attemptId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const finalized = mapExamAttempt(updated);
  await syncEnrollmentCompletion(
    attempt.student_id,
    examRow.course_id,
    actorId ?? attempt.student_id,
  );
  return finalized;
}

export async function getAttemptDetailForTeacher(
  userId: string,
  role: string,
  courseId: string,
  attemptId: string,
) {
  const allowed = await canManageCourse(userId, role, courseId);
  if (!allowed) throw new Error("Forbidden");

  const canGrade = await canGradeAttempt(userId, role, attemptId);
  if (!canGrade) throw new Error("Forbidden");

  const supabase = await getSupabase();
  const { data: attemptRow, error: attemptError } = await supabase
    .from("exam_attempts")
    .select("*, exams!inner(*), profiles:student_id(full_name)")
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptError) throw new Error(attemptError.message);
  if (!attemptRow) throw new Error("Attempt not found");

  const examRow = Array.isArray(attemptRow.exams)
    ? attemptRow.exams[0]
    : attemptRow.exams;
  if (!examRow || examRow.course_id !== courseId) {
    throw new Error("Attempt not found");
  }

  const profileRow = Array.isArray(attemptRow.profiles)
    ? attemptRow.profiles[0]
    : attemptRow.profiles;

  const [questionRows, answerRows, optionRows] = await Promise.all([
    throwOnError(
      "getAttemptDetailQuestions",
      await supabase
        .from("exam_questions")
        .select("*")
        .eq("exam_id", attemptRow.exam_id)
        .order("sort_order"),
    ),
    throwOnError(
      "getAttemptDetailAnswers",
      await supabase
        .from("exam_answers")
        .select("*")
        .eq("attempt_id", attemptId),
    ),
    throwOnError(
      "getAttemptDetailOptions",
      await supabase
        .from("exam_question_options")
        .select("*, exam_questions!inner(exam_id)")
        .eq("exam_questions.exam_id", attemptRow.exam_id),
    ),
  ]);

  const optionsByQuestion = new Map<
    string,
    ReturnType<typeof mapExamQuestionOption>[]
  >();
  for (const row of optionRows) {
    const option = mapExamQuestionOption(row);
    const existing = optionsByQuestion.get(option.questionId) ?? [];
    existing.push(option);
    optionsByQuestion.set(option.questionId, existing);
  }

  const answersByQuestion = new Map(
    answerRows.map((row) => [row.question_id, mapExamAnswer(row)]),
  );

  const questions = questionRows.map((row) => {
    const question = mapExamQuestion(row);
    return {
      question,
      options: (optionsByQuestion.get(question.id) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
      answer: answersByQuestion.get(question.id) ?? null,
    };
  });

  return {
    attempt: mapExamAttempt(attemptRow),
    exam: mapExam(examRow),
    studentName: profileRow?.full_name ?? "Unknown student",
    questions,
  };
}

export async function listAttemptsForCourse(courseId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listAttemptsForCourse",
    await supabase
      .from("exam_attempts")
      .select("*, exams!inner(*), profiles:student_id(full_name)")
      .eq("exams.course_id", courseId)
      .order("submitted_at", { ascending: false, nullsFirst: false }),
  );

  return data.map((row) => {
    const examRow = Array.isArray(row.exams) ? row.exams[0] : row.exams;
    if (!examRow) {
      throw new Error("listAttemptsForCourse: missing exam");
    }
    const profileRow = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;

    return {
      attempt: mapExamAttempt(row),
      exam: mapExam(examRow),
      studentName: profileRow?.full_name ?? "Unknown student",
    };
  });
}
