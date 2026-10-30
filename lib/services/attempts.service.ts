import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import {
  mapExam,
  mapExamAnswer,
  mapExamAttempt,
  mapExamQuestion,
  mapExamQuestionOption,
  type Exam,
  type ExamAnswer,
  type ExamAttempt,
  type ExamAnswerRow,
} from "@/lib/supabase/mappers";
import { assertPublishedCourseForStudent } from "@/lib/services/course-access.service";
import { examOutcome, syncEnrollmentCompletion } from "@/lib/services/completion.service";
import { getStudentCourseIds } from "@/lib/services/enrollments.service";
import { listQuestionsForStudent } from "@/lib/services/questions.service";
import { tryFinalizeAttempt } from "@/lib/services/grading.service";

function gradeObjectiveAnswer(
  questionType: string,
  selectedOptionIds: string[] | null,
  options: ReturnType<typeof mapExamQuestionOption>[],
): boolean {
  const correctIds = options
    .filter((option) => option.isCorrect)
    .map((option) => option.id)
    .sort();

  const selected = [...(selectedOptionIds ?? [])].sort();

  if (questionType === "single_choice" || questionType === "true_false") {
    return (
      selected.length === 1 &&
      correctIds.length === 1 &&
      selected[0] === correctIds[0]
    );
  }

  if (questionType === "multiple_choice") {
    return (
      selected.length === correctIds.length &&
      selected.every((id, index) => id === correctIds[index])
    );
  }

  return false;
}

async function assertStudentEnrolled(studentId: string, courseId: string) {
  const enrolled = await getStudentCourseIds(studentId);
  if (!enrolled.includes(courseId)) {
    throw new Error("Not enrolled in this course");
  }
  await assertPublishedCourseForStudent(courseId);
}

function isTimeExpired(attempt: ExamAttempt, exam: Exam) {
  if (!exam.timeLimitMinutes) return false;
  const expiresAt =
    attempt.startedAt.getTime() + exam.timeLimitMinutes * 60_000;
  return Date.now() > expiresAt;
}

function assertAttemptInProgress(attempt: ExamAttempt, exam: Exam) {
  if (attempt.status !== "in_progress") {
    throw new Error("Attempt is no longer in progress");
  }
  if (isTimeExpired(attempt, exam)) {
    throw new Error("Time limit exceeded");
  }
}

function isQuestionAnswered(
  questionType: string,
  answer: ExamAnswer | undefined,
) {
  if (!answer) return false;
  if (questionType === "open") {
    return Boolean(answer.openText?.trim());
  }
  return (answer.selectedOptionIds?.length ?? 0) > 0;
}

export async function listExamsForStudentCourse(
  studentId: string,
  courseId: string,
) {
  await assertStudentEnrolled(studentId, courseId);

  const supabase = await getSupabase();
  const exams = throwOnError(
    "listExamsForStudentCourse",
    await supabase.from("exams").select("*").eq("course_id", courseId),
  );

  const attempts = throwOnError(
    "listStudentAttemptsForCourse",
    await supabase
      .from("exam_attempts")
      .select("*, exams!inner(course_id)")
      .eq("student_id", studentId)
      .eq("exams.course_id", courseId)
      .order("started_at", { ascending: false }),
  );

  return exams.map((examRow) => {
    const exam = mapExam(examRow);
    const examAttempts = attempts
      .filter((row) => row.exam_id === exam.id)
      .map(mapExamAttempt);

    const completed = examAttempts.filter(
      (attempt) => attempt.status !== "in_progress",
    ).length;

    const inProgress = examAttempts.find(
      (attempt) => attempt.status === "in_progress",
    );

    const bestScore = examAttempts.reduce<number | null>((best, attempt) => {
      if (attempt.scorePercent == null) return best;
      if (best == null || attempt.scorePercent > best) return attempt.scorePercent;
      return best;
    }, null);

    const reviewableAttempts = examAttempts
      .filter((attempt) => attempt.status !== "in_progress")
      .map((attempt) => ({
        id: attempt.id,
        status: attempt.status,
        scorePercent: attempt.scorePercent,
        submittedAt: attempt.submittedAt,
      }));

    const latestReviewableAttemptId = reviewableAttempts[0]?.id ?? null;

    const outcome = examOutcome(
      { id: exam.id, max_attempts: exam.maxAttempts },
      examAttempts.map((attempt) => ({
        exam_id: exam.id,
        status: attempt.status,
      })),
    );

    return {
      exam,
      attemptCount: examAttempts.length,
      completedCount: completed,
      inProgressAttemptId: inProgress?.id ?? null,
      canStart: examAttempts.length < exam.maxAttempts && !inProgress,
      bestScore,
      latestStatus: examAttempts[0]?.status ?? null,
      latestReviewableAttemptId,
      reviewableAttempts,
      outcome,
    };
  });
}

export async function getAttemptForStudent(studentId: string, attemptId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("*, exams(*)")
    .eq("id", attemptId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const examRow = Array.isArray(data.exams) ? data.exams[0] : data.exams;
  if (!examRow) throw new Error("Missing exam for attempt");

  await assertStudentEnrolled(studentId, examRow.course_id);

  return {
    attempt: mapExamAttempt(data),
    exam: mapExam(examRow),
  };
}

export async function startAttempt(studentId: string, examId: string) {
  const supabase = await getSupabase();
  const { data: examRow, error: examError } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .maybeSingle();

  if (examError) throw new Error(examError.message);
  if (!examRow) throw new Error("Exam not found");

  await assertStudentEnrolled(studentId, examRow.course_id);

  const { data: existingInProgress, error: inProgressError } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("exam_id", examId)
    .eq("student_id", studentId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (inProgressError) throw new Error(inProgressError.message);
  if (existingInProgress) {
    return mapExamAttempt(existingInProgress);
  }

  const { count, error: countError } = await supabase
    .from("exam_attempts")
    .select("*", { count: "exact", head: true })
    .eq("exam_id", examId)
    .eq("student_id", studentId);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) >= examRow.max_attempts) {
    throw new Error("Maximum attempts reached");
  }

  const { data, error } = await supabase
    .from("exam_attempts")
    .insert({
      exam_id: examId,
      student_id: studentId,
      status: "in_progress",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("startAttempt: empty response");

  return mapExamAttempt(data);
}

export async function getAttemptAnswers(attemptId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "getAttemptAnswers",
    await supabase.from("exam_answers").select("*").eq("attempt_id", attemptId),
  );
  return data.map(mapExamAnswer);
}

export async function saveAnswer(
  studentId: string,
  attemptId: string,
  questionId: string,
  input: {
    selectedOptionIds?: string[] | null;
    openText?: string | null;
  },
) {
  const context = await getAttemptForStudent(studentId, attemptId);
  if (!context) throw new Error("Attempt not found");
  assertAttemptInProgress(context.attempt, context.exam);

  const supabase = await getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("exam_answers")
    .select("id")
    .eq("attempt_id", attemptId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  const payload = {
    selected_option_ids: input.selectedOptionIds ?? null,
    open_text: input.openText ?? null,
  };

  if (existing) {
    const data = throwOnError<ExamAnswerRow>(
      "updateAnswer",
      await supabase
        .from("exam_answers")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single(),
    );
    return mapExamAnswer(data);
  }

  const data = throwOnError<ExamAnswerRow>(
    "createAnswer",
    await supabase
      .from("exam_answers")
      .insert({
        attempt_id: attemptId,
        question_id: questionId,
        ...payload,
      })
      .select()
      .single(),
  );
  return mapExamAnswer(data);
}

export async function submitAttempt(
  studentId: string,
  attemptId: string,
  options?: { skipUnansweredCheck?: boolean },
) {
  const context = await getAttemptForStudent(studentId, attemptId);
  if (!context) throw new Error("Attempt not found");
  if (context.attempt.status !== "in_progress") {
    throw new Error("Attempt already submitted");
  }

  const timedOut = isTimeExpired(context.attempt, context.exam);
  if (!timedOut) {
    assertAttemptInProgress(context.attempt, context.exam);
  }

  const supabase = await getSupabase();
  const [questions, answers] = await Promise.all([
    listQuestionsForStudent(context.exam.id),
    getAttemptAnswers(attemptId),
  ]);

  const admin = createAdminClient();
  const optionsResult = await admin
    .from("exam_question_options")
    .select("*, exam_questions!inner(exam_id)")
    .eq("exam_questions.exam_id", context.exam.id);

  if (optionsResult.error) throw new Error(optionsResult.error.message);

  const optionsByQuestion = new Map<
    string,
    ReturnType<typeof mapExamQuestionOption>[]
  >();
  for (const row of optionsResult.data ?? []) {
    const mapped = mapExamQuestionOption(row);
    const existing = optionsByQuestion.get(mapped.questionId) ?? [];
    existing.push(mapped);
    optionsByQuestion.set(mapped.questionId, existing);
  }

  const answerByQuestion = new Map(
    answers.map((answer) => [answer.questionId, answer]),
  );

  if (!options?.skipUnansweredCheck && !timedOut) {
    const unanswered = questions.filter(
      ({ question }) =>
        !isQuestionAnswered(
          question.questionType,
          answerByQuestion.get(question.id),
        ),
    );
    if (unanswered.length > 0) {
      throw new Error(
        `Please answer all questions before submitting (${unanswered.length} remaining)`,
      );
    }
  }

  let hasOpenQuestions = false;

  for (const { question } of questions) {
    const answer = answerByQuestion.get(question.id);
    if (!answer) continue;

    if (question.questionType === "open") {
      hasOpenQuestions = true;
      continue;
    }

    const options = optionsByQuestion.get(question.id) ?? [];
    const isCorrect = gradeObjectiveAnswer(
      question.questionType,
      answer.selectedOptionIds,
      options,
    );

    assertNoError(
      "gradeObjectiveAnswer",
      await supabase
        .from("exam_answers")
        .update({ is_correct: isCorrect })
        .eq("id", answer.id),
    );
  }

  const submittedAt = new Date().toISOString();

  if (hasOpenQuestions) {
    assertNoError(
      "submitAttemptPendingReview",
      await supabase
        .from("exam_attempts")
        .update({
          status: "pending_review",
          submitted_at: submittedAt,
        })
        .eq("id", attemptId),
    );
    await syncEnrollmentCompletion(studentId, context.exam.courseId, studentId);
  } else {
    assertNoError(
      "submitAttemptSubmitted",
      await supabase
        .from("exam_attempts")
        .update({
          status: "submitted",
          submitted_at: submittedAt,
        })
        .eq("id", attemptId),
    );
    await tryFinalizeAttempt(attemptId);
  }

  const { data: updated, error } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();

  if (error) throw new Error(error.message);
  return mapExamAttempt(updated);
}

export async function getExamTakeContext(
  studentId: string,
  examId: string,
  attemptId: string,
) {
  const context = await getAttemptForStudent(studentId, attemptId);
  if (!context || context.exam.id !== examId) return null;
  if (context.attempt.status !== "in_progress") return null;

  const [questions, answers] = await Promise.all([
    listQuestionsForStudent(examId),
    getAttemptAnswers(attemptId),
  ]);

  return {
    ...context,
    questions,
    answers,
  };
}

export async function getAttemptResultDetailForStudent(
  studentId: string,
  attemptId: string,
) {
  const context = await getAttemptForStudent(studentId, attemptId);
  if (!context) return null;
  if (context.attempt.status === "in_progress") return null;

  const supabase = await getSupabase();
  const questionRows = throwOnError(
    "getAttemptResultQuestions",
    await supabase
      .from("exam_questions")
      .select("id, exam_id, question_type, text, sort_order, attachment_path")
      .eq("exam_id", context.exam.id)
      .order("sort_order"),
  );

  const answers = await getAttemptAnswers(attemptId);
  const answersByQuestion = new Map(
    answers.map((answer) => [answer.questionId, answer]),
  );

  const optionRows = throwOnError(
    "getAttemptResultOptions",
    await supabase
      .from("exam_question_options_student")
      .select("id, question_id, text, sort_order")
      .in(
        "question_id",
        questionRows.map((question) => question.id),
      ),
  );

  const showCorrectAnswers = context.attempt.status !== "pending_review";
  const correctOptionsByQuestion = new Map<string, string[]>();

  if (showCorrectAnswers) {
    const admin = createAdminClient();
    const correctOptionRows = throwOnError(
      "getAttemptResultCorrectOptions",
      await admin
        .from("exam_question_options")
        .select("question_id, text, is_correct, exam_questions!inner(exam_id)")
        .eq("exam_questions.exam_id", context.exam.id)
        .eq("is_correct", true),
    );

    for (const row of correctOptionRows) {
      const existing = correctOptionsByQuestion.get(row.question_id) ?? [];
      existing.push(row.text);
      correctOptionsByQuestion.set(row.question_id, existing);
    }
  }

  const optionsByQuestion = new Map<string, Array<{ id: string; text: string }>>();
  for (const row of optionRows) {
    const existing = optionsByQuestion.get(row.question_id) ?? [];
    existing.push({ id: row.id, text: row.text });
    optionsByQuestion.set(row.question_id, existing);
  }

  const questions = questionRows.map((row) => {
    const question = mapExamQuestion(row);
    const answer = answersByQuestion.get(question.id) ?? null;
    const options = optionsByQuestion.get(question.id) ?? [];

    let answerText = "No answer";
    if (answer) {
      if (question.questionType === "open") {
        answerText = answer.openText ?? "—";
      } else {
        const selected = new Set(answer.selectedOptionIds ?? []);
        const labels = options
          .filter((option) => selected.has(option.id))
          .map((option) => option.text);
        answerText = labels.length ? labels.join(", ") : "—";
      }
    }

    let correctAnswerText: string | null = null;
    if (
      showCorrectAnswers &&
      answer?.isCorrect === false &&
      question.questionType !== "open"
    ) {
      const labels = correctOptionsByQuestion.get(question.id) ?? [];
      correctAnswerText = labels.length ? labels.join(", ") : null;
    }

    return {
      question,
      answer,
      answerText,
      correctAnswerText,
    };
  });

  return {
    ...context,
    questions,
  };
}
