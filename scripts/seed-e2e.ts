import { config } from "dotenv";
import { createAdminClient } from "../lib/supabase/admin-client";

config({ path: ".env.local" });
config({ path: ".env" });

const E2E_PASSWORD = process.env.E2E_SEED_PASSWORD ?? "12345678";
const TEACHER_EMAIL =
  process.env.E2E_TEACHER_EMAIL ?? "e2e-teacher@stanfordschoolpatios.com";
const STUDENT_EMAIL =
  process.env.E2E_STUDENT_EMAIL ?? "e2e-student@stanfordschoolpatios.com";
const ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? "administracion@stanfordschoolpatios.com";

async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
) {
  const normalized = email.toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;

    const match = (data.users ?? []).find(
      (user) => user.email?.toLowerCase() === normalized,
    );
    if (match) return match;

    if ((data.users ?? []).length < 1000) break;
    page += 1;
  }

  return null;
}

/** Removes stale profile rows left when auth users were deleted outside the app. */
async function removeOrphanProfiles(
  admin: ReturnType<typeof createAdminClient>,
  role: "teacher" | "student" | "admin",
  fullName: string,
) {
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id")
    .eq("role", role)
    .eq("full_name", fullName);

  if (error) throw error;

  for (const profile of profiles ?? []) {
    const { data: authUser, error: authError } =
      await admin.auth.admin.getUserById(profile.id);
    const authMissing =
      authError?.message?.toLowerCase().includes("user not found") ||
      !authUser?.user;

    if (authError && !authMissing) throw authError;

    if (authMissing) {
      const { error: deleteError } = await admin
        .from("profiles")
        .delete()
        .eq("id", profile.id);
      if (deleteError) throw deleteError;
    }
  }
}

async function ensureUser(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  role: "teacher" | "student" | "admin",
  fullName: string,
) {
  const existing = await findAuthUserByEmail(admin, email);

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      user_metadata: { role, full_name: fullName },
    });
    await admin
      .from("profiles")
      .update({ role, full_name: fullName })
      .eq("id", existing.id);
    return existing.id;
  }

  await removeOrphanProfiles(admin, role, fullName);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: E2E_PASSWORD,
    email_confirm: true,
    user_metadata: { role, full_name: fullName },
  });
  if (error) throw error;
  return data.user.id;
}

async function seedE2E() {
  const admin = createAdminClient();

  await ensureUser(admin, ADMIN_EMAIL, "admin", "E2E Admin");

  const teacherId = await ensureUser(
    admin,
    TEACHER_EMAIL,
    "teacher",
    "E2E Teacher",
  );
  const studentId = await ensureUser(
    admin,
    STUDENT_EMAIL,
    "student",
    "E2E Student",
  );

  let languageId: string;
  const { data: languages } = await admin
    .from("languages")
    .select("id, code")
    .eq("code", "en")
    .limit(1);

  if (languages?.[0]) {
    languageId = languages[0].id;
  } else {
    const { data: language, error } = await admin
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
    if (error) throw error;
    languageId = language.id;
  }

  await admin.from("teacher_profiles").upsert(
    {
      profile_id: teacherId,
      language_id: languageId,
      bio: "E2E test teacher",
    },
    { onConflict: "profile_id" },
  );

  const courseTitle = "E2E English Course";
  let courseId: string;

  const { data: existingCourse } = await admin
    .from("courses")
    .select("id")
    .eq("title_es", courseTitle)
    .maybeSingle();

  if (existingCourse) {
    courseId = existingCourse.id;
    await admin
      .from("courses")
      .update({ published: true, language_id: languageId })
      .eq("id", courseId);
  } else {
    const { data: course, error } = await admin
      .from("courses")
      .insert({
        title: courseTitle,
        title_es: courseTitle,
        title_en: courseTitle,
        title_fr: courseTitle,
        description_es: "Curso de prueba E2E",
        description_en: "E2E test course",
        description_fr: "Cours de test E2E",
        language_id: languageId,
        published: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    courseId = course.id;
  }

  await admin.from("course_teachers").upsert(
    { course_id: courseId, teacher_id: teacherId },
    { onConflict: "course_id,teacher_id" },
  );

  let groupId: string;
  const { data: existingGroup } = await admin
    .from("course_groups")
    .select("id")
    .eq("course_id", courseId)
    .eq("name", "Group 1")
    .maybeSingle();

  if (existingGroup) {
    groupId = existingGroup.id;
  } else {
    const { data: group, error: groupError } = await admin
      .from("course_groups")
      .insert({
        course_id: courseId,
        name: "Group 1",
        sort_order: 0,
        is_active: true,
      })
      .select("id")
      .single();
    if (groupError) throw groupError;
    groupId = group.id;
  }

  await admin.from("group_teachers").upsert(
    { group_id: groupId, teacher_id: teacherId },
    { onConflict: "group_id,teacher_id" },
  );

  await admin.from("course_enrollments").upsert(
    {
      course_id: courseId,
      student_id: studentId,
      group_id: groupId,
      status: "active",
      completion_status: "in_progress",
    },
    { onConflict: "course_id,student_id" },
  );

  let examId: string;
  const { data: existingExam } = await admin
    .from("exams")
    .select("id")
    .eq("course_id", courseId)
    .eq("title", "E2E Smoke Exam")
    .maybeSingle();

  if (existingExam) {
    examId = existingExam.id;
  } else {
    const { data: exam, error } = await admin
      .from("exams")
      .insert({
        course_id: courseId,
        title: "E2E Smoke Exam",
        max_attempts: 3,
        pass_threshold_percent: 50,
      })
      .select("id")
      .single();
    if (error) throw error;
    examId = exam.id;
  }

  const { data: existingQuestion } = await admin
    .from("exam_questions")
    .select("id")
    .eq("exam_id", examId)
    .limit(1)
    .maybeSingle();

  if (!existingQuestion) {
    const { data: question, error: questionError } = await admin
      .from("exam_questions")
      .insert({
        exam_id: examId,
        question_type: "single_choice",
        text: "What is 2 + 2?",
        sort_order: 0,
      })
      .select("id")
      .single();
    if (questionError) throw questionError;

    const { error: optionsError } = await admin.from("exam_question_options").insert([
      {
        question_id: question.id,
        text: "3",
        is_correct: false,
        sort_order: 0,
      },
      {
        question_id: question.id,
        text: "4",
        is_correct: true,
        sort_order: 1,
      },
    ]);
    if (optionsError) throw optionsError;
  }

  const openExamTitle = "E2E Open Question Exam";
  let openExamId: string;
  const { data: existingOpenExam } = await admin
    .from("exams")
    .select("id")
    .eq("course_id", courseId)
    .eq("title", openExamTitle)
    .maybeSingle();

  if (existingOpenExam) {
    openExamId = existingOpenExam.id;
    await admin
      .from("exams")
      .update({
        max_attempts: 5,
        pass_threshold_percent: 50,
      })
      .eq("id", openExamId);
  } else {
    const { data: openExam, error: openExamError } = await admin
      .from("exams")
      .insert({
        course_id: courseId,
        title: openExamTitle,
        max_attempts: 5,
        pass_threshold_percent: 50,
      })
      .select("id")
      .single();
    if (openExamError) throw openExamError;
    openExamId = openExam.id;
  }

  await admin
    .from("exam_attempts")
    .delete()
    .eq("exam_id", openExamId)
    .eq("student_id", studentId);

  const { data: openExamQuestions } = await admin
    .from("exam_questions")
    .select("id, question_type, sort_order")
    .eq("exam_id", openExamId);

  const hasMcQuestion = (openExamQuestions ?? []).some(
    (question) => question.question_type === "single_choice",
  );
  const hasOpenQuestion = (openExamQuestions ?? []).some(
    (question) => question.question_type === "open",
  );

  if (!hasMcQuestion) {
    const { data: mcQuestion, error: mcQuestionError } = await admin
      .from("exam_questions")
      .insert({
        exam_id: openExamId,
        question_type: "single_choice",
        text: "E2E open exam: What is 2 + 2?",
        sort_order: 0,
      })
      .select("id")
      .single();
    if (mcQuestionError) throw mcQuestionError;

    const { error: mcOptionsError } = await admin
      .from("exam_question_options")
      .insert([
        {
          question_id: mcQuestion.id,
          text: "3",
          is_correct: false,
          sort_order: 0,
        },
        {
          question_id: mcQuestion.id,
          text: "4",
          is_correct: true,
          sort_order: 1,
        },
      ]);
    if (mcOptionsError) throw mcOptionsError;
  }

  if (!hasOpenQuestion) {
    const { error: openQuestionError } = await admin
      .from("exam_questions")
      .insert({
        exam_id: openExamId,
        question_type: "open",
        text: "E2E open exam: Describe your favorite hobby in one sentence.",
        sort_order: 1,
      });
    if (openQuestionError) throw openQuestionError;
  }

  const { data: existingContent } = await admin
    .from("course_content")
    .select("id")
    .eq("course_id", courseId)
    .eq("title", "E2E Sample Video")
    .maybeSingle();

  if (!existingContent) {
    const { error: contentError } = await admin.from("course_content").insert({
      course_id: courseId,
      title: "E2E Sample Video",
      sort_order: 0,
      content_type: "youtube",
      external_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    });
    if (contentError) throw contentError;
  }

  console.log("E2E seed complete.");
  console.log(`Admin: ${ADMIN_EMAIL} / ${E2E_PASSWORD}`);
  console.log(`Teacher: ${TEACHER_EMAIL} / ${E2E_PASSWORD}`);
  console.log(`Student: ${STUDENT_EMAIL} / ${E2E_PASSWORD}`);
  console.log(`Course ID: ${courseId}`);
  console.log(`Exam ID: ${examId}`);
  console.log(`Open exam ID: ${openExamId}`);
}

seedE2E().catch((err) => {
  console.error("E2E seed failed:", err.message ?? err);
  process.exit(1);
});
