"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { actionError, actionFail, type ActionResult } from "@/lib/actions/result";
import { recordAuditEvent } from "@/lib/services/audit.service";
import {
  addStudentsToGroup,
  removeStudentFromCourse,
} from "@/lib/services/enrollments.service";
import {
  createGroup,
  deleteGroup,
  getNextGroupSortOrder,
  setGroupTeachers,
  updateGroup,
} from "@/lib/services/groups.service";

function revalidateCourse(courseId: string) {
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/groups`);
  revalidatePath(`/admin/students`);
  revalidatePath(`/admin/teachers`);
  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath(`/student`);
}

function parseSortOrderForCreate(
  formData: FormData,
  fallback: number,
): number {
  const raw = String(formData.get("sortOrder") ?? "").trim();
  if (raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function parseSortOrderForUpdate(formData: FormData): number {
  const raw = String(formData.get("sortOrder") ?? "").trim();
  const value = Number(raw === "" ? 0 : raw);
  return Number.isFinite(value) ? value : 0;
}

export async function createGroupAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("admin");
    const courseId = String(formData.get("courseId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const maxStudentsRaw = String(formData.get("maxStudents") ?? "").trim();
    const teacherIds = formData.getAll("teacherIds").map((value) => String(value));

    if (!courseId || !name) {
      return actionFail("groupNameRequired");
    }

    const nextSortOrder = await getNextGroupSortOrder(courseId);
    const group = await createGroup({
      courseId,
      name,
      sortOrder: parseSortOrderForCreate(formData, nextSortOrder),
      maxStudents: maxStudentsRaw ? Number(maxStudentsRaw) : null,
    });

    if (teacherIds.length) {
      await setGroupTeachers(group.id, teacherIds);
    }

    await recordAuditEvent({
      eventType: "group_created",
      actorId: profile.id,
      targetType: "course_group",
      targetId: group.id,
      courseId,
      metadata: { name, teacherIds },
    });

    revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateGroupAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("admin");
    const id = String(formData.get("id") ?? "");
    const courseId = String(formData.get("courseId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const maxStudentsRaw = String(formData.get("maxStudents") ?? "").trim();
    const isActive = formData.get("isActive") === "on";
    const teacherIds = formData.getAll("teacherIds").map((value) => String(value));

    if (!id || !courseId || !name) {
      return actionFail("groupNameRequired");
    }

    await updateGroup(id, {
      name,
      sortOrder: parseSortOrderForUpdate(formData),
      maxStudents: maxStudentsRaw ? Number(maxStudentsRaw) : null,
      isActive,
    });
    await setGroupTeachers(id, teacherIds);

    await recordAuditEvent({
      eventType: "group_updated",
      actorId: profile.id,
      targetType: "course_group",
      targetId: id,
      courseId,
      metadata: { name, teacherIds, isActive },
    });

    revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteGroupAction(
  groupId: string,
  courseId: string,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("admin");
    await deleteGroup(groupId);

    await recordAuditEvent({
      eventType: "group_deleted",
      actorId: profile.id,
      targetType: "course_group",
      targetId: groupId,
      courseId,
      metadata: {},
    });

    revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function addStudentsToGroupAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const courseId = String(formData.get("courseId") ?? "");
    const groupId = String(formData.get("groupId") ?? "");
    const studentIds = formData
      .getAll("studentIds")
      .map((value) => String(value))
      .filter(Boolean);

    if (!courseId || !groupId) {
      return actionFail("groupNameRequired");
    }

    if (studentIds.length === 0) {
      return actionFail("studentIdRequired");
    }

    if (studentIds.length) {
      await addStudentsToGroup(courseId, groupId, studentIds);
    }

    revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeStudentFromGroupAction(
  groupId: string,
  courseId: string,
  studentId: string,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    if (!groupId || !courseId || !studentId) {
      return actionFail("studentIdRequired");
    }

    await removeStudentFromCourse(courseId, studentId);
    revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}
