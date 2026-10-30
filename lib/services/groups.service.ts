import "server-only";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import { mapCourseGroup, mapProfile, type CourseGroup } from "@/lib/supabase/mappers";

type CourseGroupRow = {
  id: string;
  course_id: string;
  name: string;
  sort_order: number;
  max_students: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateGroupInput = {
  courseId: string;
  name: string;
  sortOrder?: number;
  maxStudents?: number | null;
};

export type UpdateGroupInput = Partial<{
  name: string;
  sortOrder: number;
  maxStudents: number | null;
  isActive: boolean;
}>;

export async function listGroupsForCourse(courseId: string) {
  const supabase = await getSupabase();
  const data = throwOnError<CourseGroupRow[]>(
    "listGroupsForCourse",
    await supabase
      .from("course_groups")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  );
  return data.map(mapCourseGroup);
}

export async function listActiveGroupsForCourse(courseId: string) {
  const groups = await listGroupsForCourse(courseId);
  return groups.filter((group) => group.isActive);
}

export async function assertGroupAssignableForStudent(
  courseId: string,
  groupId: string,
  studentId?: string,
) {
  const group = await getGroupById(groupId);
  if (!group || group.courseId !== courseId) {
    throw new Error("Invalid group for course");
  }
  if (!group.isActive) {
    throw new Error("Group is not active");
  }

  if (group.maxStudents == null) return;

  const supabase = await getSupabase();
  if (studentId) {
    const { data: existing } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .eq("group_id", groupId)
      .maybeSingle();
    if (existing) return;
  }

  const count = await countStudentsInGroup(groupId);
  if (count >= group.maxStudents) {
    throw new Error("Group is full");
  }
}

export async function listAllGroupsWithCourses() {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listAllGroupsWithCourses",
    await supabase
      .from("course_groups")
      .select("*, courses(id, title_es, title_en, title_fr, title)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  );

  return data.map((row) => ({
    group: mapCourseGroup(row),
    courseId: row.course_id as string,
    courseTitle:
      (row.courses as { title_es?: string; title?: string } | null)?.title_es ??
      (row.courses as { title?: string } | null)?.title ??
      "",
  }));
}

export async function getGroupById(groupId: string): Promise<CourseGroup | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("course_groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCourseGroup(data) : null;
}

export async function getDefaultGroupForCourse(courseId: string) {
  const groups = await listGroupsForCourse(courseId);
  return groups.find((group) => group.isActive) ?? groups[0] ?? null;
}

export async function getNextGroupSortOrder(courseId: string) {
  const groups = await listGroupsForCourse(courseId);
  if (groups.length === 0) return 0;
  return Math.max(...groups.map((group) => group.sortOrder)) + 1;
}

export async function createGroup(input: CreateGroupInput) {
  const supabase = await getSupabase();
  const data = throwOnError<CourseGroupRow>(
    "createGroup",
    await supabase
      .from("course_groups")
      .insert({
        course_id: input.courseId,
        name: input.name,
        sort_order: input.sortOrder ?? 0,
        max_students: input.maxStudents ?? null,
      })
      .select()
      .single(),
  );
  return mapCourseGroup(data);
}

export async function updateGroup(groupId: string, input: UpdateGroupInput) {
  const supabase = await getSupabase();
  const data = throwOnError<CourseGroupRow>(
    "updateGroup",
    await supabase
      .from("course_groups")
      .update({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
        ...(input.maxStudents !== undefined
          ? { max_students: input.maxStudents }
          : {}),
        ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId)
      .select()
      .single(),
  );
  return mapCourseGroup(data);
}

export async function deleteGroup(groupId: string) {
  const studentCount = await countStudentsInGroup(groupId);
  if (studentCount > 0) {
    throw new Error("Group has active enrollments");
  }

  const supabase = await getSupabase();
  assertNoError(
    "deleteGroup",
    await supabase.from("course_groups").delete().eq("id", groupId),
  );
}

export async function countStudentsInGroup(groupId: string) {
  const supabase = await getSupabase();
  const { count, error } = await supabase
    .from("course_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("status", "active");

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function listTeachersInGroup(groupId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listTeachersInGroup",
    await supabase
      .from("group_teachers")
      .select("teacher_id, profiles(*)")
      .eq("group_id", groupId),
  );

  return data.map((row) => {
    const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return profileRow
      ? mapProfile(profileRow)
      : {
          id: row.teacher_id as string,
          role: "teacher" as const,
          requiresEnrollmentApproval: true,
          fullName: null,
          avatarUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
  });
}

export async function listStudentsInGroup(groupId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listStudentsInGroup",
    await supabase
      .from("course_enrollments")
      .select("*, profiles(*)")
      .eq("group_id", groupId)
      .eq("status", "active"),
  );

  return data.map((row) => {
    const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      enrollmentId: row.id as string,
      student: profileRow
        ? mapProfile(profileRow)
        : {
            id: row.student_id as string,
            role: "student" as const,
            requiresEnrollmentApproval: true,
            fullName: null,
            avatarUrl: null,
            createdAt: new Date(row.enrolled_at as string),
            updatedAt: new Date(row.enrolled_at as string),
          },
    };
  });
}

export async function getGroupRoster(groupId: string) {
  const [group, teachers, students] = await Promise.all([
    getGroupById(groupId),
    listTeachersInGroup(groupId),
    listStudentsInGroup(groupId),
  ]);

  if (!group) return null;

  return { group, teachers, students };
}

export async function setGroupTeachers(groupId: string, teacherIds: string[]) {
  const current = await getGroupTeacherIds(groupId);
  const next = [...new Set(teacherIds)];
  const toAdd = next.filter((id) => !current.includes(id));
  const toRemove = current.filter((id) => !next.includes(id));

  const supabase = await getSupabase();

  if (toAdd.length) {
    assertNoError(
      "assignGroupTeachers",
      await supabase.from("group_teachers").insert(
        toAdd.map((teacherId) => ({
          group_id: groupId,
          teacher_id: teacherId,
        })),
      ),
    );
  }

  if (toRemove.length) {
    assertNoError(
      "removeGroupTeachers",
      await supabase
        .from("group_teachers")
        .delete()
        .eq("group_id", groupId)
        .in("teacher_id", toRemove),
    );
  }
}

export async function getGroupTeacherIds(groupId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "getGroupTeacherIds",
    await supabase
      .from("group_teachers")
      .select("teacher_id")
      .eq("group_id", groupId),
  );
  return data.map((row) => row.teacher_id as string);
}

export async function batchGroupIdsByTeacher() {
  const supabase = await getSupabase();
  const data = throwOnError(
    "batchGroupIdsByTeacher",
    await supabase.from("group_teachers").select("teacher_id, group_id"),
  );

  const map = new Map<string, string[]>();
  for (const row of data) {
    const existing = map.get(row.teacher_id as string) ?? [];
    existing.push(row.group_id as string);
    map.set(row.teacher_id as string, existing);
  }
  return map;
}

export async function getTeacherGroupIds(teacherId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "getTeacherGroupIds",
    await supabase
      .from("group_teachers")
      .select("group_id")
      .eq("teacher_id", teacherId),
  );
  return data.map((row) => row.group_id as string);
}

export async function getTeacherCourseIdsFromGroups(teacherId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "getTeacherCourseIdsFromGroups",
    await supabase
      .from("group_teachers")
      .select("group_id, course_groups(course_id)")
      .eq("teacher_id", teacherId),
  );

  const courseIds = new Set<string>();
  for (const row of data) {
    const groupRow = Array.isArray(row.course_groups)
      ? row.course_groups[0]
      : row.course_groups;
    if (groupRow?.course_id) {
      courseIds.add(groupRow.course_id as string);
    }
  }
  return [...courseIds];
}

export async function listCoursesWithGroupsForAdmin() {
  const { listCoursesForAdmin } = await import("./courses.service");
  const courses = await listCoursesForAdmin();
  return Promise.all(
    courses.map(async ({ course }) => ({
      course,
      groups: await listActiveGroupsForCourse(course.id),
    })),
  );
}

