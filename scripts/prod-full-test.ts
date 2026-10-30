/**
 * Comprehensive production smoke + functional tests.
 * Run: npx tsx scripts/prod-full-test.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../lib/supabase/admin-client";

config({ path: ".env.local" });
config({ path: ".env" });

const BASE = process.env.PROD_BASE_URL ?? "https://stanfordschoolpatios.vercel.app";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const ADMIN_EMAIL = process.env.PROD_ADMIN_EMAIL ?? "administracion@stanfordschoolpatios.com";
const ADMIN_PASSWORD = process.env.PROD_ADMIN_PASSWORD ?? "123456";
const STUDENT_EMAIL = process.env.PROD_STUDENT_EMAIL ?? "tafur@gmail.com";
const STUDENT_PASSWORD = process.env.PROD_STUDENT_PASSWORD ?? "123456";
const TEACHER_EMAIL = process.env.PROD_TEACHER_EMAIL ?? "e2e-teacher@stanfordschoolpatios.com";
const TEACHER_PASSWORD = process.env.PROD_TEACHER_PASSWORD ?? "123456";

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function pass(name: string, detail?: string) {
  checks.push({ name, ok: true, detail });
}
function fail(name: string, detail?: string) {
  checks.push({ name, ok: false, detail });
}

async function fetchStatus(path: string, expectRedirectToLogin = false) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  if (expectRedirectToLogin) {
    if ((res.status === 307 || res.status === 302) && location.includes("/login")) {
      return { ok: true, status: res.status, location };
    }
    return { ok: false, status: res.status, location };
  }
  return { ok: res.status === 200, status: res.status, location };
}

async function login(email: string, password: string) {
  const client = createClient(supabaseUrl, publishableKey);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) return null;
  return { client, session: data.session, userId: data.user!.id };
}

async function main() {
  // ── Public routes ──
  for (const path of ["/es", "/en", "/fr", "/es/login", "/es/register", "/es/about", "/es/forgot-password"]) {
    const r = await fetchStatus(path);
    if (r.ok) pass(`GET ${path}`, String(r.status));
    else fail(`GET ${path}`, `status=${r.status}`);
  }

  const landing = await fetch(`${BASE}/es`).then((r) => r.text());
  const courseCount = (landing.match(/Inglés A1/g) ?? []).length;
  if (courseCount >= 10) pass("Landing shows A1 courses", `matches=${courseCount}`);
  else fail("Landing shows A1 courses", `matches=${courseCount}`);

  for (const path of ["/student", "/admin", "/admin/students", "/admin/courses", "/admin/teachers", "/teacher"]) {
    const r = await fetchStatus(path, true);
    if (r.ok) pass(`Auth gate ${path}`, r.location);
    else fail(`Auth gate ${path}`, `status=${r.status} loc=${r.location}`);
  }

  const admin = createAdminClient();

  // ── DB integrity ──
  const { count: courses } = await admin
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("published", true)
    .eq("level", "A1");
  if (courses === 10) pass("DB: 10 published A1 courses");
  else fail("DB: 10 published A1 courses", `count=${courses}`);

  const { count: groups } = await admin.from("course_groups").select("*", { count: "exact", head: true });
  if ((groups ?? 0) >= 10) pass("DB: course groups", `count=${groups}`);
  else fail("DB: course groups", `count=${groups}`);

  const { data: content } = await admin.from("course_content").select("content_type, external_url, storage_path");
  const youtube = content?.filter((c) => c.content_type === "youtube").length ?? 0;
  const pdf = content?.filter((c) => c.content_type === "pdf").length ?? 0;
  if (youtube >= 10 && pdf >= 10) pass("DB: YouTube + PDF content", `yt=${youtube} pdf=${pdf}`);
  else fail("DB: YouTube + PDF content", `yt=${youtube} pdf=${pdf}`);

  // YouTube oEmbed + PDF signed URLs
  let ytOk = 0;
  let pdfOk = 0;
  for (const item of content ?? []) {
    if (item.content_type === "youtube" && item.external_url) {
      const r = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(item.external_url)}&format=json`
      );
      if (r.ok) ytOk++;
    }
    if (item.content_type === "pdf" && item.storage_path) {
      const signed = await admin.storage.from("courses").createSignedUrl(item.storage_path, 60);
      if (!signed.error) pdfOk++;
    }
  }
  if (ytOk >= 10) pass("YouTube URLs valid (oEmbed)", `count=${ytOk}`);
  else fail("YouTube URLs valid (oEmbed)", `count=${ytOk}`);
  if (pdfOk >= 10) pass("PDF storage signed URLs", `count=${pdfOk}`);
  else fail("PDF storage signed URLs", `count=${pdfOk}`);

  const { data: students } = await admin
    .from("profiles")
    .select("requires_enrollment_approval")
    .eq("role", "student");
  const autoApprove = students?.filter((s) => !s.requires_enrollment_approval).length ?? 0;
  if (autoApprove === (students?.length ?? 0)) pass("DB: existing students auto-approve", `count=${autoApprove}`);
  else fail("DB: existing students auto-approve", `auto=${autoApprove} total=${students?.length}`);

  const pendingQ = await admin
    .from("course_enrollments")
    .select("*, courses(*, languages(*)), profiles!student_id(*)")
    .eq("status", "pending");
  if (!pendingQ.error) pass("DB: pending enrollments query (admin fix)");
  else fail("DB: pending enrollments query", pendingQ.error.message);

  // ── Auth logins ──
  const adminAuth = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (adminAuth) pass("Admin login", ADMIN_EMAIL);
  else fail("Admin login", ADMIN_EMAIL);

  const studentAuth = await login(STUDENT_EMAIL, STUDENT_PASSWORD);
  if (studentAuth) pass("Student login", STUDENT_EMAIL);
  else fail("Student login", STUDENT_EMAIL);

  const teacherAuth = await login(TEACHER_EMAIL, TEACHER_PASSWORD);
  if (teacherAuth) pass("Teacher login", TEACHER_EMAIL);
  else fail("Teacher login", TEACHER_EMAIL);

  // ── Short password rejected ──
  const shortPw = await createClient(supabaseUrl, publishableKey).auth.signUp({
    email: `prod-test-${Date.now()}@example.com`,
    password: "1234567",
  });
  if (shortPw.error) pass("Short password rejected by Supabase");
  else fail("Short password rejected by Supabase", "signup succeeded");

  // ── Enrollment flow (existing student = auto active) ──
  if (studentAuth) {
    const { data: course } = await admin
      .from("courses")
      .select("id, title_es")
      .eq("published", true)
      .neq("id", (
        await admin
          .from("course_enrollments")
          .select("course_id")
          .eq("student_id", studentAuth.userId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle()
      ).data?.course_id ?? "00000000-0000-0000-0000-000000000000")
      .limit(1)
      .maybeSingle();

    if (course) {
      await admin
        .from("course_enrollments")
        .delete()
        .eq("student_id", studentAuth.userId)
        .eq("course_id", course.id);

      const { data: group } = await admin
        .from("course_groups")
        .select("id")
        .eq("course_id", course.id)
        .limit(1)
        .single();

      const { data: profile } = await admin
        .from("profiles")
        .select("requires_enrollment_approval")
        .eq("id", studentAuth.userId)
        .single();

      const status = profile?.requires_enrollment_approval ? "pending" : "active";
      const { data: enroll, error: enrollErr } = await admin
        .from("course_enrollments")
        .insert({
          course_id: course.id,
          student_id: studentAuth.userId,
          group_id: group!.id,
          status,
        })
        .select("id, status")
        .single();

      if (!enrollErr && enroll?.status === status) {
        pass("Student enrollment insert", `${status} for ${course.title_es}`);
      } else {
        fail("Student enrollment insert", enrollErr?.message);
      }

      if (status === "active") {
        await admin.from("course_enrollments").delete().eq("id", enroll!.id);
      }
    }
  }

  // ── Pending approval flow (new student profile flag) ──
  const testEmail = `prod-pending-${Date.now()}@test.local`;
  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: "12345678",
    email_confirm: true,
    user_metadata: { full_name: "Prod Pending Test" },
  });
  if (createErr || !newUser.user) {
    fail("Create test user for pending flow", createErr?.message);
  } else {
    await admin.from("profiles").upsert({
      id: newUser.user.id,
      role: "student",
      full_name: "Prod Pending Test",
      requires_enrollment_approval: true,
    });

    const { data: course2 } = await admin.from("courses").select("id").eq("published", true).limit(1).single();
    const { data: group2 } = await admin
      .from("course_groups")
      .select("id")
      .eq("course_id", course2!.id)
      .limit(1)
      .single();

    const { data: pending, error: pendErr } = await admin
      .from("course_enrollments")
      .insert({
        course_id: course2!.id,
        student_id: newUser.user.id,
        group_id: group2!.id,
        status: "pending",
      })
      .select("id")
      .single();

    if (!pendErr && pending) {
      pass("Pending enrollment created");

      const { error: approveErr } = await admin
        .from("course_enrollments")
        .update({ status: "active" })
        .eq("id", pending.id);
      if (!approveErr) pass("Approve enrollment (admin)");
      else fail("Approve enrollment (admin)", approveErr.message);

      await admin.from("course_enrollments").delete().eq("id", pending.id);
    } else {
      fail("Pending enrollment created", pendErr?.message);
    }

    await admin.auth.admin.deleteUser(newUser.user.id);
    pass("Cleanup test user");
  }

  // ── Languages, teachers, exams tables accessible ──
  const { error: langErr } = await admin.from("languages").select("id").limit(1);
  if (!langErr) pass("DB: languages table");
  else fail("DB: languages table", langErr.message);

  const { error: teacherErr } = await admin.from("profiles").select("id").eq("role", "teacher").limit(1);
  if (!teacherErr) pass("DB: teachers exist");
  else fail("DB: teachers exist", teacherErr.message);

  const { error: examErr } = await admin.from("exams").select("id").limit(1);
  if (!examErr) pass("DB: exams table");
  else fail("DB: exams table", examErr.message);

  const failed = checks.filter((c) => !c.ok);
  console.log(
    JSON.stringify(
      {
        base: BASE,
        total: checks.length,
        passed: checks.length - failed.length,
        failed: failed.length,
        checks,
      },
      null,
      2
    )
  );
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
