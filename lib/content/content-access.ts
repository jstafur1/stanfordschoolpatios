import "server-only";
import { canManageCourse } from "@/lib/permissions/courses";
import { assertPublishedCourseForStudent } from "@/lib/services/course-access.service";
import { getStudentCourseIds } from "@/lib/services/enrollments.service";
import { getSupabase } from "@/lib/supabase/server-query";
import {
  mapCourseContent,
  type CourseContent,
  type CourseContentRow,
} from "@/lib/supabase/mappers";
import type { UserRole } from "@/lib/auth/roles";

export async function getContentById(
  contentId: string,
): Promise<CourseContent | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("course_content")
    .select("*")
    .eq("id", contentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCourseContent(data as CourseContentRow) : null;
}

export async function assertCanViewContent(
  userId: string,
  role: UserRole,
  courseId: string,
  contentId: string,
): Promise<CourseContent> {
  const content = await getContentById(contentId);

  if (!content || content.courseId !== courseId) {
    throw new Error("Content not found");
  }

  if (role === "admin") {
    return content;
  }

  if (role === "teacher") {
    const allowed = await canManageCourse(userId, role, courseId);
    if (!allowed) throw new Error("Forbidden");
    return content;
  }

  if (role === "student") {
    const enrolledIds = await getStudentCourseIds(userId);
    if (!enrolledIds.includes(courseId)) {
      throw new Error("Forbidden");
    }
    await assertPublishedCourseForStudent(courseId);
    return content;
  }

  throw new Error("Forbidden");
}
