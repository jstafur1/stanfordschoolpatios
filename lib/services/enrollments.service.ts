import "server-only";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  mapCourse,
  mapCourseEnrollment,
  mapCourseGroup,
  mapLanguage,
  mapProfile,
} from "@/lib/supabase/mappers";
import { getDefaultGroupForCourse, assertGroupAssignableForStudent } from "./groups.service";

export type StudentEnrollmentInput = {
  courseId: string;
  groupId: string;
};

async function getDefaultGroupForCourseEnrollment(courseId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("course_groups")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCourseGroup(data) : null;
}

export async function getStudentCourseIds(studentId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "getStudentCourseIds",
    await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("student_id", studentId)
      .eq("status", "active"),
  );
  return data.map((row) => row.course_id);
}

export async function getStudentEnrollments(
  studentId: string,
): Promise<StudentEnrollmentInput[]> {
  const supabase = await getSupabase();
  const data = throwOnError(
    "getStudentEnrollments",
    await supabase
      .from("course_enrollments")
      .select("course_id, group_id")
      .eq("student_id", studentId),
  );

  return data
    .filter((row) => row.group_id)
    .map((row) => ({
      courseId: row.course_id as string,
      groupId: row.group_id as string,
    }));
}

async function resolveGroupId(
  courseId: string,
  groupId?: string,
  studentId?: string,
) {
  const resolved = groupId
    ? groupId
    : (await getDefaultGroupForCourse(courseId))?.id;
  if (!resolved) {
    throw new Error(`No group available for course ${courseId}`);
  }
  await assertGroupAssignableForStudent(courseId, resolved, studentId);
  return resolved;
}

export async function setStudentEnrollments(
  studentId: string,
  enrollments: StudentEnrollmentInput[],
) {
  const current = await getStudentEnrollments(studentId);
  const nextMap = new Map(
    enrollments.map((enrollment) => [enrollment.courseId, enrollment.groupId]),
  );
  const currentMap = new Map(
    current.map((enrollment) => [enrollment.courseId, enrollment.groupId]),
  );

  const toAdd = [...nextMap.entries()].filter(([courseId]) => !currentMap.has(courseId));
  const toRemove = [...currentMap.keys()].filter((courseId) => !nextMap.has(courseId));
  const toUpdate = [...nextMap.entries()].filter(
    ([courseId, groupId]) =>
      currentMap.has(courseId) && currentMap.get(courseId) !== groupId,
  );

  const supabase = await getSupabase();

  if (toAdd.length) {
    const rows = await Promise.all(
      toAdd.map(async ([courseId, groupId]) => ({
        course_id: courseId,
        student_id: studentId,
        group_id: await resolveGroupId(courseId, groupId, studentId),
      })),
    );
    assertNoError("enrollStudents", await supabase.from("course_enrollments").insert(rows));
  }

  for (const [courseId, groupId] of toUpdate) {
    assertNoError(
      "updateStudentGroup",
      await supabase
        .from("course_enrollments")
        .update({ group_id: await resolveGroupId(courseId, groupId, studentId) })
        .eq("student_id", studentId)
        .eq("course_id", courseId),
    );
  }

  if (toRemove.length) {
    assertNoError(
      "unenrollStudents",
      await supabase
        .from("course_enrollments")
        .delete()
        .eq("student_id", studentId)
        .in("course_id", toRemove),
    );
  }
}

/** Backward-compatible helper when only course IDs are provided. */
export async function setStudentEnrollmentsByCourseIds(
  studentId: string,
  courseIds: string[],
) {
  const uniqueCourseIds = [...new Set(courseIds)];
  const enrollments = await Promise.all(
    uniqueCourseIds.map(async (courseId) => ({
      courseId,
      groupId: await resolveGroupId(courseId, undefined, studentId),
    })),
  );
  await setStudentEnrollments(studentId, enrollments);
}

export async function listCoursesForStudent(studentId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listCoursesForStudent",
    await supabase
      .from("course_enrollments")
      .select("*, courses(*, languages(*)), course_groups(*)")
      .eq("student_id", studentId)
      .in("status", ["active", "completed"])
      .order("enrolled_at", { ascending: false }),
  );

  return data
    .map((row) => {
      const courseRow = Array.isArray(row.courses) ? row.courses[0] : row.courses;
      if (!courseRow) return null;
      const languageRow = Array.isArray(courseRow.languages)
        ? courseRow.languages[0]
        : courseRow.languages;
      const groupRow = Array.isArray(row.course_groups)
        ? row.course_groups[0]
        : row.course_groups;
      return {
        enrollment: mapCourseEnrollment(row),
        course: mapCourse(courseRow),
        language: languageRow ? mapLanguage(languageRow) : null,
        group: groupRow ? mapCourseGroup(groupRow) : null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export async function listPendingCoursesForStudent(studentId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listPendingCoursesForStudent",
    await supabase
      .from("course_enrollments")
      .select("*, courses(*, languages(*)), course_groups(*)")
      .eq("student_id", studentId)
      .eq("status", "pending")
      .order("enrolled_at", { ascending: false }),
  );

  return data
    .map((row) => {
      const courseRow = Array.isArray(row.courses) ? row.courses[0] : row.courses;
      if (!courseRow) return null;
      const languageRow = Array.isArray(courseRow.languages)
        ? courseRow.languages[0]
        : courseRow.languages;
      const groupRow = Array.isArray(row.course_groups)
        ? row.course_groups[0]
        : row.course_groups;
      return {
        enrollment: mapCourseEnrollment(row),
        course: mapCourse(courseRow),
        language: languageRow ? mapLanguage(languageRow) : null,
        group: groupRow ? mapCourseGroup(groupRow) : null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export async function batchCourseIdsByStudent() {
  const supabase = await getSupabase();
  const data = throwOnError(
    "batchCourseIdsByStudent",
    await supabase.from("course_enrollments").select("student_id, course_id"),
  );

  const map = new Map<string, string[]>();
  for (const row of data) {
    const existing = map.get(row.student_id) ?? [];
    existing.push(row.course_id);
    map.set(row.student_id, existing);
  }
  return map;
}

export async function batchEnrollmentsByStudent() {
  const supabase = await getSupabase();
  const data = throwOnError(
    "batchEnrollmentsByStudent",
    await supabase
      .from("course_enrollments")
      .select("student_id, course_id, group_id"),
  );

  const map = new Map<string, StudentEnrollmentInput[]>();
  for (const row of data) {
    if (!row.group_id) continue;
    const existing = map.get(row.student_id) ?? [];
    existing.push({
      courseId: row.course_id as string,
      groupId: row.group_id as string,
    });
    map.set(row.student_id, existing);
  }
  return map;
}

export async function addStudentsToGroup(
  courseId: string,
  groupId: string,
  studentIds: string[],
) {
  const { getGroupById } = await import("./groups.service");
  const group = await getGroupById(groupId);
  if (!group || group.courseId !== courseId) {
    throw new Error("Invalid group for course");
  }

  const uniqueIds = [...new Set(studentIds)];
  const supabase = await getSupabase();

  for (const studentId of uniqueIds) {
    await assertGroupAssignableForStudent(courseId, groupId, studentId);

    const { data: existing, error: existingError } = await supabase
      .from("course_enrollments")
      .select("id, group_id")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existing) {
      if (existing.group_id === groupId) continue;
      assertNoError(
        "updateStudentGroup",
        await supabase
          .from("course_enrollments")
          .update({ group_id: groupId })
          .eq("student_id", studentId)
          .eq("course_id", courseId),
      );
      continue;
    }

    const current = await getStudentEnrollments(studentId);
    await setStudentEnrollments(studentId, [
      ...current,
      { courseId, groupId },
    ]);
  }
}

export async function removeStudentFromCourse(
  courseId: string,
  studentId: string,
) {
  const supabase = await getSupabase();
  assertNoError(
    "unenrollStudentFromCourse",
    await supabase
      .from("course_enrollments")
      .delete()
      .eq("student_id", studentId)
      .eq("course_id", courseId),
  );
}

export async function getStudentEnrollmentForCourse(
  studentId: string,
  courseId: string,
) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("course_enrollments")
    .select("*, course_groups(*)")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const groupRow = Array.isArray(data.course_groups)
    ? data.course_groups[0]
    : data.course_groups;

  return {
    enrollment: mapCourseEnrollment(data),
    group: groupRow ? mapCourseGroup(groupRow) : null,
  };
}

export async function listPublishedCoursesForStudentJoin(studentId: string) {
  const supabase = await getSupabase();
  const [coursesResult, enrollmentsResult] = await Promise.all([
    supabase
      .from("courses")
      .select("*, languages(*)")
      .eq("published", true)
      .order("title_es", { ascending: true }),
    supabase
      .from("course_enrollments")
      .select("course_id, status")
      .eq("student_id", studentId),
  ]);

  if (coursesResult.error) throw new Error(coursesResult.error.message);
  if (enrollmentsResult.error) throw new Error(enrollmentsResult.error.message);

  const enrollmentByCourse = new Map(
    (enrollmentsResult.data ?? []).map((row) => [
      row.course_id as string,
      row.status as string,
    ]),
  );

  return (coursesResult.data ?? [])
    .map((row) => {
      const languageRow = Array.isArray(row.languages)
        ? row.languages[0]
        : row.languages;
      return {
        course: mapCourse(row),
        language: languageRow ? mapLanguage(languageRow) : null,
        enrollmentStatus: enrollmentByCourse.get(row.id as string) ?? null,
      };
    })
    .filter(
      (row) =>
        row.enrollmentStatus !== "active" && row.enrollmentStatus !== "pending",
    );
}

export async function listPendingEnrollmentsForAdmin() {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listPendingEnrollmentsForAdmin",
    await supabase
      .from("course_enrollments")
      .select("*, courses(*, languages(*)), profiles!student_id(*)")
      .eq("status", "pending")
      .order("enrolled_at", { ascending: true }),
  );

  return data.map((row) => {
    const courseRow = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    const profileRow = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;
    const languageRow = courseRow
      ? Array.isArray(courseRow.languages)
        ? courseRow.languages[0]
        : courseRow.languages
      : null;

    return {
      enrollment: mapCourseEnrollment(row),
      course: courseRow ? mapCourse(courseRow) : null,
      student: profileRow ? mapProfile(profileRow) : null,
      language: languageRow ? mapLanguage(languageRow) : null,
    };
  });
}

export async function requestCourseEnrollment(studentId: string, courseId: string) {
  const supabase = await getSupabase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("requires_enrollment_approval")
    .eq("id", studentId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error("Profile not found");

  const existing = await getStudentEnrollmentForCourse(studentId, courseId);
  if (existing?.enrollment.status === "active") {
    throw new Error("Already enrolled in this course");
  }
  if (existing?.enrollment.status === "pending") {
    throw new Error("Enrollment request already pending");
  }
  if (existing?.enrollment.status === "completed") {
    throw new Error("Already enrolled in this course");
  }

  const groupId = (await getDefaultGroupForCourseEnrollment(courseId))?.id;
  if (!groupId) throw new Error("No group available for course");

  const status = profile.requires_enrollment_approval ? "pending" : "active";

  if (existing) {
    assertNoError(
      "requestCourseEnrollment.update",
      await supabase
        .from("course_enrollments")
        .update({ status, group_id: groupId })
        .eq("id", existing.enrollment.id),
    );
    return status;
  }

  assertNoError(
    "requestCourseEnrollment.insert",
    await supabase.from("course_enrollments").insert({
      course_id: courseId,
      student_id: studentId,
      group_id: groupId,
      status,
    }),
  );

  return status;
}

export async function approveEnrollment(enrollmentId: string) {
  const supabase = await getSupabase();
  assertNoError(
    "approveEnrollment",
    await supabase
      .from("course_enrollments")
      .update({ status: "active" })
      .eq("id", enrollmentId)
      .eq("status", "pending"),
  );
}

export async function rejectEnrollment(enrollmentId: string) {
  const supabase = await getSupabase();
  assertNoError(
    "rejectEnrollment",
    await supabase
      .from("course_enrollments").delete().eq("id", enrollmentId).eq("status", "pending"),
  );
}
