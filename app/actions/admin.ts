"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { actionError, actionFail, type ActionResult } from "@/lib/actions/result";
import {
  createLanguage,
  deleteLanguage,
  updateLanguage,
} from "@/lib/services/languages.service";
import {
  createTeacher,
  deleteTeacher,
  listTeachersForAdmin,
  updateTeacherAccount,
} from "@/lib/services/teachers.service";
import {
  createUser,
  deleteStudent,
  updateStudent,
} from "@/lib/services/users.service";
import {
  createCourse,
  deleteCourse,
  updateCourse,
} from "@/lib/services/courses.service";
import { isCourseLevel } from "@/lib/courses/levels";
import {
  createContent,
  deleteContent,
  getNextContentSortOrder,
  listContentByCourse,
  updateContent,
} from "@/lib/services/content.service";
import { isPasswordLongEnough } from "@/lib/auth/password";
import {
  approveEnrollment,
  rejectEnrollment,
} from "@/lib/services/enrollments.service";
import {
  deleteCourseContentFile,
  uploadCourseContentFile,
} from "@/lib/services/storage.service";

const ADMIN_PATHS = [
  "/admin",
  "/admin/students",
  "/admin/languages",
  "/admin/courses",
  "/admin/teachers",
];

function revalidateAdmin(courseId?: string) {
  for (const path of ADMIN_PATHS) {
    revalidatePath(path);
  }
  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}/content`);
  }
  revalidatePath("/student");
  revalidatePath("/es");
  revalidatePath("/en");
  revalidatePath("/fr");
}

function parseLanguageForm(formData: FormData) {
  return {
    nameEs: String(formData.get("nameEs") ?? "").trim(),
    nameEn: String(formData.get("nameEn") ?? "").trim(),
    nameFr: String(formData.get("nameFr") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim(),
    isActive: formData.get("isActive") === "on",
  };
}

function parseCourseIds(formData: FormData) {
  return formData.getAll("courseIds").map((value) => String(value));
}

function parseEnrollments(formData: FormData) {
  const fromRadios: Array<{ courseId: string; groupId: string }> = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("enrollment_") || typeof value !== "string" || !value) {
      continue;
    }
    fromRadios.push({
      courseId: key.slice("enrollment_".length),
      groupId: value,
    });
  }

  if (fromRadios.length > 0) {
    return fromRadios;
  }

  return formData
    .getAll("enrollments")
    .map((value) => String(value))
    .map((entry) => {
      const [courseId, groupId] = entry.split("|");
      return { courseId, groupId };
    })
    .filter((entry) => entry.courseId && entry.groupId);
}

function parseGroupIds(formData: FormData) {
  return formData.getAll("groupIds").map((value) => String(value));
}

function parseCourseForm(formData: FormData) {
  const trimOrNull = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value || null;
  };

  return {
    titleEs: String(formData.get("titleEs") ?? "").trim(),
    titleEn: String(formData.get("titleEn") ?? "").trim(),
    titleFr: String(formData.get("titleFr") ?? "").trim(),
    descriptionEs: trimOrNull("descriptionEs"),
    descriptionEn: trimOrNull("descriptionEn"),
    descriptionFr: trimOrNull("descriptionFr"),
    languageId: String(formData.get("languageId") ?? "").trim() || null,
    level: (() => {
      const value = String(formData.get("level") ?? "").trim();
      return isCourseLevel(value) ? value : null;
    })(),
    published: formData.get("published") === "on",
  };
}

export async function createLanguageAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const input = parseLanguageForm(formData);

    if (!input.nameEs || !input.nameEn || !input.nameFr || !input.code) {
      return actionFail("translationsAndCodeRequired");
    }

    await createLanguage(input);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateLanguageAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const id = String(formData.get("id") ?? "");
    const input = parseLanguageForm(formData);

    if (!id || !input.nameEs || !input.nameEn || !input.nameFr || !input.code) {
      return actionFail("translationsAndCodeRequired");
    }

    await updateLanguage(id, input);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteLanguageAction(id: string): Promise<ActionResult> {
  try {
    await requireRole("admin");
    await deleteLanguage(id);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function createStudentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "").trim();

    if (!email || !password) {
      return actionFail("emailPasswordRequired");
    }

    if (!isPasswordLongEnough(password)) {
      return actionFail("passwordMinLength");
    }

    const enrollments = parseEnrollments(formData);
    await createUser({
      email,
      password,
      role: "student",
      fullName,
      enrollments: enrollments.length ? enrollments : undefined,
      courseIds: enrollments.length ? undefined : parseCourseIds(formData),
    });
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateStudentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const id = String(formData.get("id") ?? "");
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!id) return actionFail("studentIdRequired");

    if (password && !isPasswordLongEnough(password)) {
      return actionFail("passwordMinLength");
    }

    const enrollments = parseEnrollments(formData);
    await updateStudent(id, {
      fullName: fullName || undefined,
      email: email || undefined,
      password: password || undefined,
      enrollments: enrollments.length ? enrollments : undefined,
      courseIds: enrollments.length ? undefined : parseCourseIds(formData),
    });
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteStudentAction(id: string): Promise<ActionResult> {
  try {
    await requireRole("admin");
    await deleteStudent(id);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function createCourseAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("admin");
    const input = parseCourseForm(formData);

    if (!input.titleEs || !input.titleEn || !input.titleFr) {
      return actionFail("titleRequiredAllLanguages");
    }

    await createCourse(input, profile.id);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateCourseAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const id = String(formData.get("id") ?? "");
    const input = parseCourseForm(formData);

    if (!id || !input.titleEs || !input.titleEn || !input.titleFr) {
      return actionFail("titleRequiredAllLanguages");
    }

    await updateCourse(id, input);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  try {
    await requireRole("admin");
    await deleteCourse(id);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function createTeacherAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "").trim();
    const languageId = String(formData.get("languageId") ?? "").trim() || undefined;
    const bio = String(formData.get("bio") ?? "").trim() || undefined;
    const groupIds = parseGroupIds(formData);

    if (!email || !password || !fullName) {
      return actionFail("teacherNameEmailPasswordRequired");
    }

    if (!isPasswordLongEnough(password)) {
      return actionFail("passwordMinLength");
    }

    await createTeacher({ email, password, fullName, languageId, bio, groupIds });
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateTeacherAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const id = String(formData.get("id") ?? "");
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const languageId = String(formData.get("languageId") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const groupIds = parseGroupIds(formData);

    if (!id || !fullName) {
      return actionFail("nameRequired");
    }

    if (password && !isPasswordLongEnough(password)) {
      return actionFail("passwordMinLength");
    }

    await updateTeacherAccount(id, {
      fullName,
      email: email || undefined,
      password: password || undefined,
      languageId: languageId || null,
      bio: bio || null,
      groupIds,
    });
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteTeacherAction(id: string): Promise<ActionResult> {
  try {
    await requireRole("admin");
    await deleteTeacher(id);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function fetchTeachersAction() {
  await requireRole("admin");
  return listTeachersForAdmin();
}

function getUploadedFile(formData: FormData) {
  const value = formData.get("file");
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

export async function createContentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
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

    revalidateAdmin(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateContentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
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
    revalidateAdmin(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteContentAction(
  id: string,
  courseId: string,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
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
    revalidateAdmin(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function approveEnrollmentAction(
  enrollmentId: string,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    await approveEnrollment(enrollmentId);
    revalidateAdmin();
    revalidatePath("/student");
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function rejectEnrollmentAction(
  enrollmentId: string,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    await rejectEnrollment(enrollmentId);
    revalidateAdmin();
    revalidatePath("/student");
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}
