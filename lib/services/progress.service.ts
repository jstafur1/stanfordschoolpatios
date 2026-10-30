import "server-only";
import { getSupabase, throwOnError } from "@/lib/supabase/server-query";
import { listContentByCourse } from "./content.service";
import { syncEnrollmentCompletion } from "./completion.service";

export async function getEnrollmentId(
  studentId: string,
  courseId: string,
): Promise<string | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

export async function listViewedContentIds(
  enrollmentId: string,
): Promise<Set<string>> {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listViewedContentIds",
    await supabase
      .from("content_views")
      .select("content_id")
      .eq("enrollment_id", enrollmentId),
  );

  return new Set(data.map((row) => row.content_id as string));
}

export async function recordContentView(
  studentId: string,
  courseId: string,
  contentId: string,
) {
  const enrollmentId = await getEnrollmentId(studentId, courseId);
  if (!enrollmentId) {
    throw new Error("Not enrolled in this course");
  }

  const supabase = await getSupabase();
  const { error } = await supabase.from("content_views").upsert(
    {
      enrollment_id: enrollmentId,
      content_id: contentId,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "enrollment_id,content_id" },
  );

  if (error) throw new Error(error.message);

  await syncEnrollmentCompletion(studentId, courseId, studentId);
}

export type StudentContentProgress = {
  studentId: string;
  studentName: string | null;
  enrollmentId: string;
  groupId: string | null;
  groupName: string | null;
  viewedCount: number;
  totalCount: number;
  completionStatus: string;
};

export async function listContentProgressForCourse(
  courseId: string,
  groupId?: string,
): Promise<StudentContentProgress[]> {
  const supabase = await getSupabase();
  const [contentItems, enrollments] = await Promise.all([
    listContentByCourse(courseId),
    throwOnError(
      "listEnrollmentsForProgress",
      await (async () => {
        let query = supabase
          .from("course_enrollments")
          .select("id, student_id, group_id, completion_status, profiles(full_name), course_groups(name)")
          .eq("course_id", courseId)
          .eq("status", "active");
        if (groupId) query = query.eq("group_id", groupId);
        return query;
      })(),
    ),
  ]);

  const totalCount = contentItems.length;
  const enrollmentIds = enrollments.map((row) => row.id as string);

  const views =
    enrollmentIds.length > 0
      ? throwOnError(
          "listViewsForProgress",
          await supabase
            .from("content_views")
            .select("enrollment_id, content_id")
            .in("enrollment_id", enrollmentIds),
        )
      : [];

  const viewsByEnrollment = new Map<string, Set<string>>();
  for (const view of views) {
    const set = viewsByEnrollment.get(view.enrollment_id as string) ?? new Set();
    set.add(view.content_id as string);
    viewsByEnrollment.set(view.enrollment_id as string, set);
  }

  return enrollments.map((row) => {
    const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const groupRow = Array.isArray(row.course_groups)
      ? row.course_groups[0]
      : row.course_groups;
    const viewed = viewsByEnrollment.get(row.id as string) ?? new Set();

    return {
      studentId: row.student_id as string,
      studentName: (profileRow?.full_name as string | null) ?? null,
      enrollmentId: row.id as string,
      groupId: (row.group_id as string | null) ?? null,
      groupName: (groupRow?.name as string | null) ?? null,
      viewedCount: viewed.size,
      totalCount,
      completionStatus: row.completion_status as string,
    };
  });
}

export async function getStudentProgressSummary(
  studentId: string,
  courseId: string,
) {
  const enrollmentId = await getEnrollmentId(studentId, courseId);
  if (!enrollmentId) return null;

  const [contentItems, viewedIds] = await Promise.all([
    listContentByCourse(courseId),
    listViewedContentIds(enrollmentId),
  ]);

  return {
    enrollmentId,
    viewedCount: viewedIds.size,
    totalCount: contentItems.length,
    viewedContentIds: [...viewedIds],
  };
}
