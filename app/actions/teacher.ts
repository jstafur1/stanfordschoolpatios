"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { actionError, actionFail, type ActionResult } from "@/lib/actions/result";
import {
  createExam,
  deleteExam,
  updateExam,
} from "@/lib/services/exams.service";
import {
  createQuestion,
  deleteQuestion,
  reorderQuestions,
  updateQuestion,
  type QuestionOptionInput,
} from "@/lib/services/questions.service";
import { submitGrade } from "@/lib/services/grading.service";
import {
  createContent,
  deleteContent,
  getNextContentSortOrder,
  listContentByCourse,
  updateContent,
} from "@/lib/services/content.service";
import { canManageCourse } from "@/lib/permissions/courses";
import {
  deleteCourseContentFile,
  uploadCourseContentFile,
} from "@/lib/services/storage.service";

function revalidateTeacherCourse(
  courseId: string,
  examId?: string,
  attemptId?: string,
) {
  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath(`/teacher/courses/${courseId}/content`);
  revalidatePath(`/teacher/courses/${courseId}/exams`);
  revalidatePath(`/teacher/courses/${courseId}/grades`);
  if (examId) {
    revalidatePath(`/teacher/courses/${courseId}/exams/${examId}`);
  }
  if (attemptId) {
    revalidatePath(`/teacher/courses/${courseId}/grades/${attemptId}`);
  }
}

function revalidateStudentCourse(courseId: string, examId?: string | null) {
  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}/exams`);
  if (examId) {
    revalidatePath(`/student/courses/${courseId}/exams/${examId}/result`);
  }
}

function parseQuestionOptions(formData: FormData): QuestionOptionInput[] {
  const options: QuestionOptionInput[] = [];
  let index = 0;
  while (formData.has(`optionText_${index}`)) {
    const text = String(formData.get(`optionText_${index}`) ?? "").trim();
    if (text) {
      options.push({
        text,
        isCorrect: formData.get(`optionCorrect_${index}`) === "on",
      });
    }
    index += 1;
  }
  return options;
}

function parseQuestionForm(formData: FormData) {
  const questionType = String(formData.get("questionType") ?? "").trim();
  const trueFalseAnswer = String(formData.get("trueFalseAnswer") ?? "true");
  const sortOrderRaw = formData.get("sortOrder");
  const sortOrder =
    sortOrderRaw != null && String(sortOrderRaw).trim() !== ""
      ? Number(sortOrderRaw)
      : undefined;

  return {
    questionType,
    text: String(formData.get("text") ?? "").trim(),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : undefined,
    options: parseQuestionOptions(formData),
    trueFalseCorrect: trueFalseAnswer === "true",
  };
}

export async function createExamAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("teacher");
    const courseId = String(formData.get("courseId") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const timeLimitRaw = String(formData.get("timeLimitMinutes") ?? "").trim();
    const maxAttempts = Number(formData.get("maxAttempts") ?? 1);
    const passThresholdRaw = String(
      formData.get("passThresholdPercent") ?? "",
    ).trim();

    if (!courseId || !title) {
      return actionFail("titleRequired");
    }

    await createExam(profile.id, profile.role, {
      courseId,
      title,
      timeLimitMinutes: timeLimitRaw ? Number(timeLimitRaw) : null,
      maxAttempts: Number.isFinite(maxAttempts) ? maxAttempts : 1,
      passThresholdPercent: passThresholdRaw ? Number(passThresholdRaw) : null,
    });
    revalidateTeacherCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateExamAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("teacher");
    const examId = String(formData.get("id") ?? "");
    const courseId = String(formData.get("courseId") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const timeLimitRaw = String(formData.get("timeLimitMinutes") ?? "").trim();
    const maxAttempts = Number(formData.get("maxAttempts") ?? 1);
    const passThresholdRaw = String(
      formData.get("passThresholdPercent") ?? "",
    ).trim();

    if (!examId || !courseId || !title) {
      return actionFail("titleRequired");
    }

    await updateExam(profile.id, profile.role, examId, {
      title,
      timeLimitMinutes: timeLimitRaw ? Number(timeLimitRaw) : null,
      maxAttempts: Number.isFinite(maxAttempts) ? maxAttempts : 1,
      passThresholdPercent: passThresholdRaw ? Number(passThresholdRaw) : null,
    });
    revalidateTeacherCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteExamAction(
  examId: string,
  courseId: string,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("teacher");
    await deleteExam(profile.id, profile.role, examId);
    revalidateTeacherCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function createQuestionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("teacher");
    const examId = String(formData.get("examId") ?? "");
    const courseId = String(formData.get("courseId") ?? "");
    const input = parseQuestionForm(formData);

    if (!examId || !courseId || !input.text || !input.questionType) {
      return actionFail("questionTextAndTypeRequired");
    }

    await createQuestion(profile.id, profile.role, examId, input);
    revalidateTeacherCourse(courseId, examId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateQuestionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("teacher");
    const questionId = String(formData.get("id") ?? "");
    const examId = String(formData.get("examId") ?? "");
    const courseId = String(formData.get("courseId") ?? "");
    const input = parseQuestionForm(formData);

    if (!questionId || !examId || !courseId || !input.text || !input.questionType) {
      return actionFail("questionTextAndTypeRequired");
    }

    await updateQuestion(profile.id, profile.role, questionId, input);
    revalidateTeacherCourse(courseId, examId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteQuestionAction(
  questionId: string,
  examId: string,
  courseId: string,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("teacher");
    await deleteQuestion(profile.id, profile.role, questionId);
    revalidateTeacherCourse(courseId, examId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function reorderQuestionsAction(
  examId: string,
  courseId: string,
  orderedQuestionIds: string[],
): Promise<ActionResult> {
  try {
    const profile = await requireRole("teacher");
    const allowed = await canManageCourse(profile.id, profile.role, courseId);
    if (!allowed) return actionFail("notAllowedCourse");

    await reorderQuestions(
      profile.id,
      profile.role,
      examId,
      orderedQuestionIds,
    );
    revalidateTeacherCourse(courseId, examId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function submitGradeAction(
  answerId: string,
  courseId: string,
  isCorrect: boolean,
  attemptId?: string,
): Promise<ActionResult> {
  try {
    const profile = await requireRole(["teacher", "admin"]);
    const { examId } = await submitGrade(
      profile.id,
      profile.role,
      answerId,
      isCorrect,
    );
    if (profile.role === "admin") {
      revalidatePath(`/admin/courses/${courseId}/grades`);
      if (attemptId) {
        revalidatePath(`/admin/courses/${courseId}/grades/${attemptId}`);
      }
    } else {
      revalidateTeacherCourse(courseId, undefined, attemptId);
    }
    revalidateStudentCourse(courseId, examId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

function getUploadedFile(formData: FormData) {
  const value = formData.get("file");
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

async function assertTeacherCourse(profileId: string, role: string, courseId: string) {
  const allowed = await canManageCourse(profileId, role, courseId);
  if (!allowed) throw new Error("Not allowed to manage this course");
}

export async function createTeacherContentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("teacher");
    const courseId = String(formData.get("courseId") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const contentType = String(formData.get("contentType") ?? "").trim();
    const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
    const sortOrder = sortOrderRaw
      ? Number(sortOrderRaw)
      : await getNextContentSortOrder(courseId);
    const externalUrl = String(formData.get("externalUrl") ?? "").trim();
    const file = getUploadedFile(formData);

    if (!courseId || !title || !contentType) {
      return actionFail("titleAndTypeRequired");
    }

    await assertTeacherCourse(profile.id, profile.role, courseId);

    const content = await createContent(courseId, {
      title,
      contentType,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      externalUrl: externalUrl || null,
      storagePath: null,
    });

    if (file) {
      const storagePath = await uploadCourseContentFile(
        courseId,
        content.id,
        file,
      );
      await updateContent(content.id, { storagePath });
    }

    revalidateTeacherCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateTeacherContentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("teacher");
    const id = String(formData.get("id") ?? "");
    const courseId = String(formData.get("courseId") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const contentType = String(formData.get("contentType") ?? "").trim();
    const sortOrder = Number(formData.get("sortOrder") ?? 0);
    const externalUrl = String(formData.get("externalUrl") ?? "").trim();
    const existingStoragePath = String(
      formData.get("existingStoragePath") ?? "",
    ).trim();
    const file = getUploadedFile(formData);

    if (!id || !courseId || !title || !contentType) {
      return actionFail("titleAndTypeRequired");
    }

    await assertTeacherCourse(profile.id, profile.role, courseId);

    let storagePath = existingStoragePath || null;
    if (file) {
      if (existingStoragePath) {
        try {
          await deleteCourseContentFile(existingStoragePath);
        } catch {
          // Old file may already be gone.
        }
      }
      storagePath = await uploadCourseContentFile(courseId, id, file);
    }

    await updateContent(id, {
      title,
      contentType,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      externalUrl: externalUrl || null,
      storagePath,
    });
    revalidateTeacherCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteTeacherContentAction(
  id: string,
  courseId: string,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("teacher");
    await assertTeacherCourse(profile.id, profile.role, courseId);

    const items = await listContentByCourse(courseId);
    const existing = items.find((item) => item.id === id);
    if (existing?.storagePath) {
      try {
        await deleteCourseContentFile(existing.storagePath);
      } catch {
        // File may already be gone.
      }
    }
    await deleteContent(id);
    revalidateTeacherCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}
