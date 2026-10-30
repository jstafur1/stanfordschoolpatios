import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { createAdminClient } from "../lib/supabase/admin-client";
import { A1_COURSE_SEEDS } from "../lib/seed/a1-courses";
import { buildSimplePdf } from "../lib/seed/build-simple-pdf";

config({ path: ".env.local" });
config({ path: ".env" });

const apply = process.argv.includes("--apply");
const COURSES_BUCKET = "courses";

async function ensureEnglishLanguage(admin: ReturnType<typeof createAdminClient>) {
  const { data: existing, error } = await admin
    .from("languages")
    .select("id, code")
    .eq("code", "en")
    .maybeSingle();

  if (error) throw error;
  if (existing) return existing.id as string;

  const { data, error: insertError } = await admin
    .from("languages")
    .insert({
      name: "English",
      name_es: "Inglés",
      name_en: "English",
      name_fr: "Anglais",
      code: "en",
      is_active: true,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return data.id as string;
}

async function rebuildA1Courses() {
  const admin = createAdminClient();

  const { data: courses, error: coursesError } = await admin
    .from("courses")
    .select("id, title_es");
  if (coursesError) throw coursesError;

  const { count: studentCount, error: studentCountError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "student");
  if (studentCountError) throw studentCountError;

  const lessonStats = A1_COURSE_SEEDS.reduce(
    (acc, course) => {
      for (const lesson of course.lessons) {
        acc[lesson.kind] += 1;
      }
      return acc;
    },
    { youtube: 0, pdf: 0 },
  );

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        existingCourses: courses?.length ?? 0,
        studentsPreserved: studentCount ?? 0,
        coursesToCreate: A1_COURSE_SEEDS.length,
        lessonsToCreate: lessonStats,
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to delete and recreate courses.");
    return;
  }

  const { error: deleteError } = await admin
    .from("courses")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) throw deleteError;

  const languageId = await ensureEnglishLanguage(admin);
  const createdCourseIds: string[] = [];

  for (const seed of A1_COURSE_SEEDS) {
    const { data: course, error: courseError } = await admin
      .from("courses")
      .insert({
        title: seed.titleEs,
        title_es: seed.titleEs,
        title_en: seed.titleEn,
        title_fr: seed.titleFr,
        description: seed.descriptionEs,
        description_es: seed.descriptionEs,
        description_en: seed.descriptionEn,
        description_fr: seed.descriptionFr,
        language_id: languageId,
        level: seed.level,
        published: true,
      })
      .select("id")
      .single();

    if (courseError) throw courseError;
    const courseId = course.id as string;
    createdCourseIds.push(courseId);

    let sortOrder = 0;
    for (const lesson of seed.lessons) {
      if (lesson.kind === "youtube") {
        const { error: contentError } = await admin.from("course_content").insert({
          course_id: courseId,
          title: lesson.titleEs,
          sort_order: sortOrder++,
          content_type: "youtube",
          external_url: lesson.youtubeUrl,
        });
        if (contentError) throw contentError;
        continue;
      }

      const contentId = randomUUID();
      const storagePath = `${courseId}/${contentId}/${lesson.filename}`;
      const pdf = buildSimplePdf(lesson.worksheetLines);

      const { error: uploadError } = await admin.storage
        .from(COURSES_BUCKET)
        .upload(storagePath, pdf, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { error: contentError } = await admin.from("course_content").insert({
        id: contentId,
        course_id: courseId,
        title: lesson.titleEs,
        sort_order: sortOrder++,
        content_type: "pdf",
        storage_path: storagePath,
      });
      if (contentError) throw contentError;
    }

    const { error: groupError } = await admin.from("course_groups").insert({
      course_id: courseId,
      name: "Group 1",
      sort_order: 0,
    });
    if (groupError) throw groupError;

    console.log(
      `Created: ${seed.titleEs} (${courseId}) — ${seed.lessons.length} lessons`,
    );
  }

  console.log(`Done. Created ${createdCourseIds.length} A1 courses with YouTube + PDF.`);
}

rebuildA1Courses().catch((error) => {
  console.error(error);
  process.exit(1);
});
