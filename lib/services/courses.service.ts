import "server-only";
import type { CourseLevel } from "@/lib/courses/levels";
import { isCourseLevel } from "@/lib/courses/levels";
import type { CatalogCourse } from "@/lib/landing/catalog-filters";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import {
  mapCourse,
  mapCourseEnrollment,
  mapCourseGroup,
  mapLanguage,
  mapProfile,
  type CourseRow,
} from "@/lib/supabase/mappers";
import { getTeacherCourseIdsFromGroups } from "./groups.service";

const CATALOG_IMAGES = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop",
];

export type { CatalogCourse } from "@/lib/landing/catalog-filters";

type CourseCatalogCounts = {
  studentCount: number;
  teacherCount: number;
  materialCount: number;
};

async function getCourseCatalogCounts(
  courseIds: string[],
): Promise<Map<string, CourseCatalogCounts>> {
  const counts = new Map<string, CourseCatalogCounts>();
  if (!courseIds.length) return counts;

  for (const courseId of courseIds) {
    counts.set(courseId, {
      studentCount: 0,
      teacherCount: 0,
      materialCount: 0,
    });
  }

  const supabase = await getSupabase();

  const enrollmentsResult = await supabase
    .from("course_enrollments")
    .select("course_id")
    .in("course_id", courseIds)
    .eq("status", "active");

  throwOnError("getCourseCatalogCounts.enrollments", enrollmentsResult);
  for (const row of enrollmentsResult.data ?? []) {
    const entry = counts.get(row.course_id as string);
    if (entry) entry.studentCount += 1;
  }

  const groupsResult = await supabase
    .from("course_groups")
    .select("id, course_id")
    .in("course_id", courseIds);

  throwOnError("getCourseCatalogCounts.groups", groupsResult);
  const groups = groupsResult.data ?? [];
  const groupToCourse = new Map(
    groups.map((group) => [group.id as string, group.course_id as string]),
  );
  const groupIds = groups.map((group) => group.id as string);

  if (groupIds.length) {
    const teachersResult = await supabase
      .from("group_teachers")
      .select("group_id, teacher_id")
      .in("group_id", groupIds);

    throwOnError("getCourseCatalogCounts.teachers", teachersResult);
    const teachersByCourse = new Map<string, Set<string>>();
    for (const row of teachersResult.data ?? []) {
      const courseId = groupToCourse.get(row.group_id as string);
      if (!courseId) continue;
      const teacherSet = teachersByCourse.get(courseId) ?? new Set<string>();
      teacherSet.add(row.teacher_id as string);
      teachersByCourse.set(courseId, teacherSet);
    }
    for (const [courseId, teacherSet] of teachersByCourse) {
      const entry = counts.get(courseId);
      if (entry) entry.teacherCount = teacherSet.size;
    }
  }

  const contentResult = await supabase
    .from("course_content")
    .select("course_id")
    .in("course_id", courseIds);

  throwOnError("getCourseCatalogCounts.content", contentResult);
  for (const row of contentResult.data ?? []) {
    const entry = counts.get(row.course_id as string);
    if (entry) entry.materialCount += 1;
  }

  return counts;
}

export async function listPublishedCoursesForCatalog(): Promise<CatalogCourse[]> {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listPublishedCoursesForCatalog",
    await supabase
      .from("courses")
      .select("*, languages(code, name_es, name_en, name_fr)")
      .eq("published", true)
      .order("created_at", { ascending: false }),
  );

  const courseIds = data.map((row) => row.id as string);
  const countsByCourse = await getCourseCatalogCounts(courseIds);

  return data.map((row, index) => {
    const course = mapCourse(row as CourseRow);
    const languageRow = Array.isArray(row.languages)
      ? row.languages[0]
      : row.languages;
    const language = languageRow ? mapLanguage(languageRow) : null;
    const counts = countsByCourse.get(course.id) ?? {
      studentCount: 0,
      teacherCount: 0,
      materialCount: 0,
    };

    return {
      id: course.id,
      title: course.titleEs,
      titleEs: course.titleEs,
      titleEn: course.titleEn,
      titleFr: course.titleFr,
      description: course.descriptionEs,
      descriptionEs: course.descriptionEs,
      descriptionEn: course.descriptionEn,
      descriptionFr: course.descriptionFr,
      image: CATALOG_IMAGES[index % CATALOG_IMAGES.length]!,
      languageCode: language?.code ?? null,
      languageNameEs: language?.nameEs ?? null,
      languageNameEn: language?.nameEn ?? null,
      languageNameFr: language?.nameFr ?? null,
      level: isCourseLevel(course.level) ? course.level : null,
      studentCount: counts.studentCount,
      teacherCount: counts.teacherCount,
      materialCount: counts.materialCount,
    };
  });
}

export async function listCoursesForAdmin() {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listCoursesForAdmin",
    await supabase.from("courses").select("*, languages(*)"),
  );

  return data.map((row) => {
    const languageRow = Array.isArray(row.languages)
      ? row.languages[0]
      : row.languages;
    return {
      course: mapCourse(row),
      language: languageRow ? mapLanguage(languageRow) : null,
    };
  });
}

export async function listCoursesForTeacher(teacherId: string) {
  const courseIds = await getTeacherCourseIdsFromGroups(teacherId);
  if (!courseIds.length) return [];

  const supabase = await getSupabase();
  const data = throwOnError(
    "listCoursesForTeacher",
    await supabase
      .from("courses")
      .select("*, languages(*)")
      .in("id", courseIds)
      .order("created_at", { ascending: false }),
  );

  return data.map((row) => {
    const languageRow = Array.isArray(row.languages)
      ? row.languages[0]
      : row.languages;
    return {
      course: mapCourse(row),
      language: languageRow ? mapLanguage(languageRow) : null,
      assignedAt: new Date(),
    };
  });
}

export async function listStudentsInCourse(courseId: string, groupId?: string) {
  const supabase = await getSupabase();
  let query = supabase
    .from("course_enrollments")
    .select("*, profiles(*), course_groups(*)")
    .eq("course_id", courseId);

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const data = throwOnError("listStudentsInCourse", await query);

  return data.map((row) => {
    const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const groupRow = Array.isArray(row.course_groups)
      ? row.course_groups[0]
      : row.course_groups;
    return {
      enrollment: mapCourseEnrollment(row),
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
      group: groupRow ? mapCourseGroup(groupRow) : null,
    };
  });
}

export async function getCourseById(courseId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCourse(data);
}

export async function createCourse(
  input: {
    titleEs: string;
    titleEn: string;
    titleFr: string;
    descriptionEs?: string | null;
    descriptionEn?: string | null;
    descriptionFr?: string | null;
    languageId?: string | null;
    level?: CourseLevel | null;
    published?: boolean;
  },
  createdBy?: string,
) {
  const supabase = await getSupabase();
  const data = throwOnError<CourseRow>(
    "createCourse",
    await supabase
      .from("courses")
      .insert({
        title: input.titleEs,
        title_es: input.titleEs,
        title_en: input.titleEn,
        title_fr: input.titleFr,
        description: input.descriptionEs ?? null,
        description_es: input.descriptionEs ?? null,
        description_en: input.descriptionEn ?? null,
        description_fr: input.descriptionFr ?? null,
        language_id: input.languageId ?? null,
        level: input.level ?? null,
        published: input.published ?? false,
        ...(createdBy ? { created_by: createdBy } : {}),
      })
      .select()
      .single(),
  );

  // Create default group for new courses
  assertNoError(
    "createDefaultGroup",
    await supabase.from("course_groups").insert({
      course_id: data.id,
      name: "Group 1",
      sort_order: 0,
    }),
  );

  return mapCourse(data);
}

export async function updateCourse(
  id: string,
  input: Partial<{
    titleEs: string;
    titleEn: string;
    titleFr: string;
    descriptionEs: string | null;
    descriptionEn: string | null;
    descriptionFr: string | null;
    languageId: string | null;
    level: CourseLevel | null;
    published: boolean;
  }>,
) {
  const supabase = await getSupabase();
  const data = throwOnError<CourseRow>(
    "updateCourse",
    await supabase
      .from("courses")
      .update({
        ...(input.titleEs !== undefined
          ? { title: input.titleEs, title_es: input.titleEs }
          : {}),
        ...(input.titleEn !== undefined ? { title_en: input.titleEn } : {}),
        ...(input.titleFr !== undefined ? { title_fr: input.titleFr } : {}),
        ...(input.descriptionEs !== undefined
          ? { description: input.descriptionEs, description_es: input.descriptionEs }
          : {}),
        ...(input.descriptionEn !== undefined
          ? { description_en: input.descriptionEn }
          : {}),
        ...(input.descriptionFr !== undefined
          ? { description_fr: input.descriptionFr }
          : {}),
        ...(input.languageId !== undefined
          ? { language_id: input.languageId }
          : {}),
        ...(input.level !== undefined ? { level: input.level } : {}),
        ...(input.published !== undefined ? { published: input.published } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single(),
  );
  return mapCourse(data);
}

export async function deleteCourse(id: string) {
  const admin = createAdminClient();
  assertNoError(
    "deleteCourse",
    await admin.from("courses").delete().eq("id", id),
  );
}
