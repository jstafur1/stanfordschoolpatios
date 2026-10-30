import "server-only";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import { listContentByCourse } from "./content.service";
import { recordAuditEvent } from "./audit.service";

export type ExamOutcome =
  | "none"
  | "in_progress"
  | "passed"
  | "failed"
  | "pending_review";

type ExamSummary = { id: string; max_attempts: number };

export function examOutcome(
  exam: ExamSummary,
  attempts: Array<{ exam_id: string; status: string }>,
) {
  const forExam = attempts.filter((attempt) => attempt.exam_id === exam.id);
  if (!forExam.length) return "none" as const;

  if (forExam.some((attempt) => attempt.status === "passed")) {
    return "passed" as const;
  }

  if (forExam.some((attempt) => attempt.status === "pending_review")) {
    return "pending_review" as const;
  }

  const submitted = forExam.filter((attempt) => attempt.status !== "in_progress");
  if (
    submitted.length >= exam.max_attempts &&
    submitted.every(
      (attempt) => attempt.status === "failed" || attempt.status === "submitted",
    )
  ) {
    return "failed" as const;
  }

  return "in_progress" as const;
}

export async function syncEnrollmentCompletion(
  studentId: string,
  courseId: string,
  actorId?: string,
) {
  const supabase = await getSupabase();

  const enrollmentRow = throwOnError(
    "syncCompletionEnrollment",
    await supabase
      .from("course_enrollments")
      .select("id, completion_status")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle(),
  );

  if (!enrollmentRow) return;

  const enrollment = enrollmentRow as { id: string; completion_status: string };

  const [exams, contentItems, viewedRows] = await Promise.all([
    throwOnError(
      "syncCompletionExams",
      await supabase.from("exams").select("id, max_attempts").eq("course_id", courseId),
    ),
    listContentByCourse(courseId),
    throwOnError(
      "syncCompletionViews",
      await supabase
        .from("content_views")
        .select("content_id")
        .eq("enrollment_id", enrollment.id),
    ),
  ]);

  const attempts =
    exams.length > 0
      ? throwOnError(
          "syncCompletionAttempts",
          await supabase
            .from("exam_attempts")
            .select("exam_id, status")
            .eq("student_id", studentId)
            .in(
              "exam_id",
              exams.map((exam) => exam.id),
            ),
        )
      : [];

  const outcomes = exams.map((exam) => examOutcome(exam, attempts));
  const viewedIds = new Set(viewedRows.map((row) => row.content_id as string));
  const examsPassed =
    exams.length === 0 || outcomes.every((outcome) => outcome === "passed");
  const materialsViewed =
    contentItems.length === 0 ||
    contentItems.every((item) => viewedIds.has(item.id));

  let completionStatus: "in_progress" | "pending_review" | "passed" | "failed" =
    "in_progress";

  if (examsPassed && materialsViewed) {
    completionStatus = "passed";
  } else if (outcomes.some((outcome) => outcome === "pending_review")) {
    completionStatus = "pending_review";
  } else if (
    exams.length > 0 &&
    outcomes.every((outcome) => outcome === "passed" || outcome === "failed") &&
    outcomes.some((outcome) => outcome === "failed")
  ) {
    completionStatus = "failed";
  }

  const payload: {
    completion_status: typeof completionStatus;
    completed_at?: string | null;
    status?: "active" | "completed";
  } = { completion_status: completionStatus };

  if (completionStatus === "passed") {
    payload.completed_at = new Date().toISOString();
    payload.status = "completed";
  } else {
    payload.completed_at = null;
    payload.status = "active";
  }

  const previousStatus = enrollment.completion_status;

  assertNoError(
    "updateEnrollmentCompletion",
    await supabase
      .from("course_enrollments")
      .update(payload)
      .eq("student_id", studentId)
      .eq("course_id", courseId),
  );

  if (previousStatus !== completionStatus && actorId) {
    await recordAuditEvent({
      eventType: "completion_status_changed",
      actorId,
      targetType: "enrollment",
      targetId: enrollment.id,
      courseId,
      metadata: {
        from: previousStatus,
        to: completionStatus,
        studentId,
        examsPassed,
        materialsViewed,
      },
    });
  }
}
