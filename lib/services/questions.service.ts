import "server-only";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import {
  mapExamQuestion,
  mapExamQuestionOption,
} from "@/lib/supabase/mappers";
import { canManageExam } from "@/lib/permissions/courses";

export type QuestionOptionInput = {
  text: string;
  isCorrect: boolean;
};

export type QuestionInput = {
  questionType: string;
  text: string;
  sortOrder?: number;
  options?: QuestionOptionInput[];
  trueFalseCorrect?: boolean;
};

export type QuestionWithOptions = {
  question: ReturnType<typeof mapExamQuestion>;
  options: ReturnType<typeof mapExamQuestionOption>[];
};

export type StudentQuestionWithOptions = {
  question: ReturnType<typeof mapExamQuestion>;
  options: Array<{
    id: string;
    questionId: string;
    text: string;
    sortOrder: number;
  }>;
};

function buildOptions(input: QuestionInput): QuestionOptionInput[] {
  if (input.questionType === "open") return [];

  if (input.questionType === "true_false") {
    const correctIsTrue = input.trueFalseCorrect ?? true;
    return [
      { text: "True", isCorrect: correctIsTrue },
      { text: "False", isCorrect: !correctIsTrue },
    ];
  }

  return input.options ?? [];
}

async function syncOptions(
  questionId: string,
  options: QuestionOptionInput[],
) {
  const supabase = await getSupabase();
  assertNoError(
    "deleteQuestionOptions",
    await supabase
      .from("exam_question_options")
      .delete()
      .eq("question_id", questionId),
  );

  if (!options.length) return;

  assertNoError(
    "insertQuestionOptions",
    await supabase.from("exam_question_options").insert(
      options.map((option, index) => ({
        question_id: questionId,
        text: option.text,
        is_correct: option.isCorrect,
        sort_order: index,
      })),
    ),
  );
}

export async function listQuestionsWithOptions(examId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listQuestionsWithOptions",
    await supabase
      .from("exam_questions")
      .select("*, exam_question_options(*)")
      .eq("exam_id", examId)
      .order("sort_order"),
  );

  return data.map((row) => {
    const optionRows = (row.exam_question_options ?? []) as Array<{
      id: string;
      question_id: string;
      text: string;
      is_correct: boolean;
      sort_order: number;
    }>;
    const options = optionRows
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapExamQuestionOption);

    return {
      question: mapExamQuestion(row),
      options,
    };
  });
}

export async function listQuestionsForStudent(examId: string) {
  const supabase = await getSupabase();
  const questionRows = throwOnError(
    "listQuestionsForStudent",
    await supabase
      .from("exam_questions")
      .select("id, exam_id, question_type, text, sort_order, attachment_path")
      .eq("exam_id", examId)
      .order("sort_order"),
  );

  const questionIds = questionRows.map((row) => row.id);
  if (!questionIds.length) return [];

  const optionRows = throwOnError(
    "listQuestionsForStudentOptions",
    await supabase
      .from("exam_question_options_student")
      .select("id, question_id, text, sort_order")
      .in("question_id", questionIds),
  );

  const optionsByQuestion = new Map<
    string,
    Array<{ id: string; question_id: string; text: string; sort_order: number }>
  >();
  for (const option of optionRows) {
    const existing = optionsByQuestion.get(option.question_id) ?? [];
    existing.push(option);
    optionsByQuestion.set(option.question_id, existing);
  }

  return questionRows.map((row) => ({
    question: mapExamQuestion(row),
    options: (optionsByQuestion.get(row.id) ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((option) => ({
        id: option.id,
        questionId: option.question_id,
        text: option.text,
        sortOrder: option.sort_order,
      })),
  }));
}

export async function createQuestion(
  userId: string,
  role: string,
  examId: string,
  input: QuestionInput,
) {
  const allowed = await canManageExam(userId, role, examId);
  if (!allowed) throw new Error("Forbidden");

  const options = buildOptions(input);
  if (
    (input.questionType === "single_choice" ||
      input.questionType === "multiple_choice") &&
    options.length < 2
  ) {
    throw new Error("Choice questions need at least two options");
  }

  const supabase = await getSupabase();

  let sortOrder = input.sortOrder;
  if (sortOrder == null) {
    const { data: maxRow } = await supabase
      .from("exam_questions")
      .select("sort_order")
      .eq("exam_id", examId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (maxRow?.sort_order ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from("exam_questions")
    .insert({
      exam_id: examId,
      question_type: input.questionType,
      text: input.text,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("createQuestion: empty response");

  await syncOptions(data.id, options);
  return mapExamQuestion(data);
}

export async function updateQuestion(
  userId: string,
  role: string,
  questionId: string,
  input: QuestionInput,
) {
  const supabase = await getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("exam_questions")
    .select("exam_id")
    .eq("id", questionId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Question not found");

  const allowed = await canManageExam(userId, role, existing.exam_id);
  if (!allowed) throw new Error("Forbidden");

  const options = buildOptions(input);
  if (
    (input.questionType === "single_choice" ||
      input.questionType === "multiple_choice") &&
    options.length < 2
  ) {
    throw new Error("Choice questions need at least two options");
  }

  const { data, error } = await supabase
    .from("exam_questions")
    .update({
      question_type: input.questionType,
      text: input.text,
      ...(input.sortOrder != null ? { sort_order: input.sortOrder } : {}),
    })
    .eq("id", questionId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("updateQuestion: empty response");

  await syncOptions(questionId, options);
  return mapExamQuestion(data);
}

export async function deleteQuestion(
  userId: string,
  role: string,
  questionId: string,
) {
  const supabase = await getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("exam_questions")
    .select("exam_id")
    .eq("id", questionId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Question not found");

  const allowed = await canManageExam(userId, role, existing.exam_id);
  if (!allowed) throw new Error("Forbidden");

  assertNoError(
    "deleteQuestion",
    await supabase.from("exam_questions").delete().eq("id", questionId),
  );

  return existing.exam_id;
}

export async function reorderQuestions(
  userId: string,
  role: string,
  examId: string,
  orderedQuestionIds: string[],
) {
  const allowed = await canManageExam(userId, role, examId);
  if (!allowed) throw new Error("Forbidden");

  const supabase = await getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("exam_questions")
    .select("id")
    .eq("exam_id", examId);

  if (fetchError) throw new Error(fetchError.message);

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  if (
    orderedQuestionIds.length !== existingIds.size ||
    orderedQuestionIds.some((id) => !existingIds.has(id))
  ) {
    throw new Error("Invalid question order");
  }

  for (const [index, questionId] of orderedQuestionIds.entries()) {
    assertNoError(
      `reorderQuestion:${questionId}`,
      await supabase
        .from("exam_questions")
        .update({ sort_order: index })
        .eq("id", questionId)
        .eq("exam_id", examId),
    );
  }
}
