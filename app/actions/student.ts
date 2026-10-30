"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { actionError, actionFail, type ActionResult } from "@/lib/actions/result";
import {
  getAttemptForStudent,
  saveAnswer,
  startAttempt,
  submitAttempt,
} from "@/lib/services/attempts.service";
import { requestCourseEnrollment } from "@/lib/services/enrollments.service";
import { recordContentView } from "@/lib/services/progress.service";

function revalidateStudentCourse(courseId: string, examId?: string) {
  revalidatePath("/student");
  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}/exams`);
  if (examId) {
    revalidatePath(`/student/courses/${courseId}/exams/${examId}`);
  }
}

export async function startExamAction(
  courseId: string,
  examId: string,
): Promise<ActionResult & { attemptId?: string }> {
  try {
    const profile = await requireRole("student");
    const attempt = await startAttempt(profile.id, examId);
    revalidateStudentCourse(courseId, examId);
    return { ok: true, attemptId: attempt.id };
  } catch (error) {
    return actionError(error);
  }
}

export async function startExamAndRedirectAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const examId = String(formData.get("examId") ?? "");
  const profile = await requireRole("student");
  const attempt = await startAttempt(profile.id, examId);
  revalidateStudentCourse(courseId, examId);
  redirect(
    `/student/courses/${courseId}/exams/${examId}?attempt=${attempt.id}`,
  );
}

export async function saveExamAnswerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const courseId = String(formData.get("courseId") ?? "");
    const examId = String(formData.get("examId") ?? "");
    const attemptId = String(formData.get("attemptId") ?? "");
    const questionId = String(formData.get("questionId") ?? "");
    const questionType = String(formData.get("questionType") ?? "");
    const selected = formData.getAll("selectedOptionIds").map(String);
    const openText = String(formData.get("openText") ?? "").trim();

    const profile = await requireRole("student");

    await saveAnswer(profile.id, attemptId, questionId, {
      selectedOptionIds:
        questionType === "open" ? null : selected.length ? selected : null,
      openText: questionType === "open" ? openText || null : null,
    });

    revalidateStudentCourse(courseId, examId);
    revalidatePath(
      `/student/courses/${courseId}/exams/${examId}?attempt=${attemptId}`,
    );
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function submitExamFormAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const examId = String(formData.get("examId") ?? "");
  const attemptId = String(formData.get("attemptId") ?? "");
  const skipUnansweredCheck = formData.get("skipUnansweredCheck") === "on";
  const profile = await requireRole("student");
  const attempt = await submitAttempt(profile.id, attemptId, {
    skipUnansweredCheck,
  });
  revalidateStudentCourse(courseId, examId);
  revalidatePath(
    `/student/courses/${courseId}/exams/${examId}/result?attempt=${attempt.id}`,
  );
  redirect(
    `/student/courses/${courseId}/exams/${examId}/result?attempt=${attempt.id}`,
  );
}

export async function getStudentAttemptResultAction(
  attemptId: string,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("student");
    const context = await getAttemptForStudent(profile.id, attemptId);
    if (!context) {
      return actionFail("attemptNotFound");
    }
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function recordContentViewAction(
  courseId: string,
  contentId: string,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("student");
    await recordContentView(profile.id, courseId, contentId);
    revalidatePath(`/student/courses/${courseId}`);
    revalidatePath(`/student/courses/${courseId}/content/${contentId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function joinCourseAction(
  courseId: string,
): Promise<ActionResult & { status?: "active" | "pending" }> {
  try {
    const profile = await requireRole("student");
    const status = await requestCourseEnrollment(profile.id, courseId);
    revalidatePath("/student");
    revalidatePath("/es");
    revalidatePath("/en");
    revalidatePath("/fr");
    return { ok: true, status: status as "active" | "pending" };
  } catch (error) {
    return actionError(error);
  }
}
