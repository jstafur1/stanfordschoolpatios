import "server-only";
import { getSupabase } from "@/lib/supabase/server-query";
import {
  getTeacherCourseIdsFromGroups,
  getTeacherGroupIds,
} from "@/lib/services/groups.service";

export async function isTeacherOfGroup(
  userId: string,
  groupId: string,
): Promise<boolean> {
  const groupIds = await getTeacherGroupIds(userId);
  return groupIds.includes(groupId);
}

export async function isTeacherOfCourse(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const courseIds = await getTeacherCourseIdsFromGroups(userId);
  return courseIds.includes(courseId);
}

export async function canManageCourse(
  userId: string,
  role: string,
  courseId: string,
): Promise<boolean> {
  if (role === "admin") return true;
  if (role === "teacher") return isTeacherOfCourse(userId, courseId);
  return false;
}

export async function canManageGroup(
  userId: string,
  role: string,
  groupId: string,
): Promise<boolean> {
  if (role === "admin") return true;
  if (role === "teacher") return isTeacherOfGroup(userId, groupId);
  return false;
}

export async function canManageExam(
  userId: string,
  role: string,
  examId: string,
): Promise<boolean> {
  if (role === "admin") return true;
  if (role !== "teacher") return false;

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("exams")
    .select("course_id")
    .eq("id", examId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return false;
  return isTeacherOfCourse(userId, data.course_id);
}

export async function canGradeAttempt(
  userId: string,
  role: string,
  attemptId: string,
): Promise<boolean> {
  if (role === "admin") return true;
  if (role !== "teacher") return false;

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("exam_id, exams(course_id)")
    .eq("id", attemptId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return false;

  const exams = data.exams as { course_id: string } | { course_id: string }[] | null;
  const courseId = Array.isArray(exams) ? exams[0]?.course_id : exams?.course_id;
  if (!courseId) return false;

  return isTeacherOfCourse(userId, courseId);
}

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.role === "admin";
}
