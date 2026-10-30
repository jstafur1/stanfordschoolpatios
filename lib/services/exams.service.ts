import "server-only";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import { mapExam, type ExamRow } from "@/lib/supabase/mappers";
import { canManageCourse } from "@/lib/permissions/courses";

export async function getExamById(examId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapExam(data) : null;
}

export async function listExamsByCourse(courseId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listExamsByCourse",
    await supabase.from("exams").select("*").eq("course_id", courseId),
  );
  return data.map(mapExam);
}

export async function createExam(
  userId: string,
  role: string,
  input: {
    courseId: string;
    title: string;
    timeLimitMinutes?: number | null;
    maxAttempts?: number;
    passThresholdPercent?: number | null;
  },
) {
  const allowed = await canManageCourse(userId, role, input.courseId);
  if (!allowed) throw new Error("Forbidden");

  const supabase = await getSupabase();
  const data = throwOnError<ExamRow>(
    "createExam",
    await supabase
      .from("exams")
      .insert({
        course_id: input.courseId,
        title: input.title,
        time_limit_minutes: input.timeLimitMinutes ?? null,
        max_attempts: input.maxAttempts ?? 1,
        pass_threshold_percent: input.passThresholdPercent ?? null,
      })
      .select()
      .single(),
  );
  return mapExam(data);
}

export async function updateExam(
  userId: string,
  role: string,
  examId: string,
  input: Partial<{
    title: string;
    timeLimitMinutes: number | null;
    maxAttempts: number;
    passThresholdPercent: number | null;
  }>,
) {
  const supabase = await getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Exam not found");

  const allowed = await canManageCourse(userId, role, existing.course_id);
  if (!allowed) throw new Error("Forbidden");

  const data = throwOnError<ExamRow>(
    "updateExam",
    await supabase
      .from("exams")
      .update({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.timeLimitMinutes !== undefined
          ? { time_limit_minutes: input.timeLimitMinutes }
          : {}),
        ...(input.maxAttempts !== undefined
          ? { max_attempts: input.maxAttempts }
          : {}),
        ...(input.passThresholdPercent !== undefined
          ? { pass_threshold_percent: input.passThresholdPercent }
          : {}),
      })
      .eq("id", examId)
      .select()
      .single(),
  );
  return mapExam(data);
}

export async function deleteExam(userId: string, role: string, examId: string) {
  const supabase = await getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("exams")
    .select("course_id")
    .eq("id", examId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Exam not found");

  const allowed = await canManageCourse(userId, role, existing.course_id);
  if (!allowed) throw new Error("Forbidden");

  assertNoError(
    "deleteExam",
    await supabase.from("exams").delete().eq("id", examId),
  );
}
