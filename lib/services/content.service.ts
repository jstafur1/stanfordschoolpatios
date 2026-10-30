import "server-only";
import { assertPublishedCourseForStudent } from "@/lib/services/course-access.service";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import {
  mapCourseContent,
  type CourseContentRow,
} from "@/lib/supabase/mappers";

export type ContentInput = {
  title: string;
  contentType: string;
  sortOrder?: number;
  storagePath?: string | null;
  externalUrl?: string | null;
};

export async function listContentByCourse(courseId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listContentByCourse",
    await supabase
      .from("course_content")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order"),
  );
  return data.map(mapCourseContent);
}

export async function getNextContentSortOrder(courseId: string) {
  const items = await listContentByCourse(courseId);
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.sortOrder)) + 1;
}

export async function createContent(courseId: string, input: ContentInput) {
  const supabase = await getSupabase();
  const data = throwOnError<CourseContentRow>(
    "createContent",
    await supabase
      .from("course_content")
      .insert({
        course_id: courseId,
        title: input.title,
        content_type: input.contentType,
        sort_order: input.sortOrder ?? 0,
        storage_path: input.storagePath ?? null,
        external_url: input.externalUrl ?? null,
      })
      .select()
      .single(),
  );
  return mapCourseContent(data);
}

export async function updateContent(id: string, input: Partial<ContentInput>) {
  const supabase = await getSupabase();
  const data = throwOnError<CourseContentRow>(
    "updateContent",
    await supabase
      .from("course_content")
      .update({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.contentType !== undefined
          ? { content_type: input.contentType }
          : {}),
        ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
        ...(input.storagePath !== undefined
          ? { storage_path: input.storagePath }
          : {}),
        ...(input.externalUrl !== undefined
          ? { external_url: input.externalUrl }
          : {}),
      })
      .eq("id", id)
      .select()
      .single(),
  );
  return mapCourseContent(data);
}

export async function deleteContent(id: string) {
  const supabase = await getSupabase();
  assertNoError(
    "deleteContent",
    await supabase.from("course_content").delete().eq("id", id),
  );
}

export async function listContentForStudentCourse(
  studentId: string,
  courseId: string,
) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return [];

  await assertPublishedCourseForStudent(courseId);
  return listContentByCourse(courseId);
}
