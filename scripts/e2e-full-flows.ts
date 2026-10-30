/**
 * Full E2E flows against live Supabase + local/prod HTTP.
 * Run: npx tsx scripts/e2e-full-flows.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../lib/supabase/admin-client";
import en from "../messages/en.json";
import es from "../messages/es.json";
import fr from "../messages/fr.json";

config({ path: ".env.local" });
config({ path: ".env" });

const LOCAL = process.env.LOCAL_BASE_URL ?? "http://localhost:3000";
const PROD = process.env.PROD_BASE_URL ?? "https://stanfordschoolpatios.vercel.app";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];
function pass(name: string, detail?: string) {
  checks.push({ name, ok: true, detail });
}
function fail(name: string, detail?: string) {
  checks.push({ name, ok: false, detail });
}

function flatten(obj: unknown, prefix = ""): string[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return prefix ? [prefix] : [];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) keys.push(...flatten(v, path));
    else keys.push(path);
  }
  return keys;
}

async function httpOk(base: string, path: string) {
  const res = await fetch(`${base}${path}`, { redirect: "manual" });
  return { status: res.status, ok: res.status === 200 || res.status === 307 || res.status === 302 };
}

async function main() {
  const admin = createAdminClient();
  const stamp = Date.now();
  const newEmail = `e2e-new-${stamp}@test.local`;
  const newPass = "TestPass123!";
  const autoEmail = `e2e-auto-${stamp}@test.local`;
  let newUserId: string | null = null;
  let autoUserId: string | null = null;
  let pendingEnrollmentId: string | null = null;

  try {
    // i18n parity
    const enKeys = new Set(flatten(en));
    const esKeys = new Set(flatten(es));
    const frKeys = new Set(flatten(fr));
    const missEs = [...enKeys].filter((k) => !esKeys.has(k));
    const missFr = [...enKeys].filter((k) => !frKeys.has(k));
    const missEn = [...new Set([...esKeys, ...frKeys])].filter((k) => !enKeys.has(k));
    if (!missEs.length && !missFr.length && !missEn.length) {
      pass("i18n key parity EN/ES/FR", `en=${enKeys.size}`);
    } else {
      fail("i18n key parity", JSON.stringify({ missEs, missFr, missEn }));
    }
    for (const locale of ["en", "es", "fr"] as const) {
      const msg = locale === "en" ? en : locale === "es" ? es : fr;
      const my =
        (msg as { app?: { student?: { dashboard?: { myCourses?: string } } } }).app?.student
          ?.dashboard?.myCourses;
      if (my) pass(`i18n myCourses (${locale})`, my);
      else fail(`i18n myCourses (${locale})`);
    }

    // HTTP local + prod
    for (const base of [LOCAL, PROD]) {
      for (const path of ["/es", "/en", "/fr", "/es/login", "/es/register", "/es/about"]) {
        const r = await httpOk(base, path);
        if (r.ok && (r.status === 200 || path.includes("login") || path.includes("register"))) {
          // public pages should be 200
          if (["/es", "/en", "/fr", "/es/login", "/es/register", "/es/about"].includes(path)) {
            if (r.status === 200) pass(`HTTP ${base}${path}`, String(r.status));
            else fail(`HTTP ${base}${path}`, String(r.status));
          }
        } else {
          fail(`HTTP ${base}${path}`, String(r.status));
        }
      }
      const landing = await fetch(`${base}/es`).then((r) => r.text());
      const n = (landing.match(/Inglés A1/g) ?? []).length;
      if (n >= 10) pass(`Landing A1 courses (${base})`, `matches=${n}`);
      else fail(`Landing A1 courses (${base})`, `matches=${n}`);
    }

    // Existing logins
    for (const [label, email, password] of [
      ["admin", "administracion@stanfordschoolpatios.com", "123456"],
      ["teacher", "e2e-teacher@stanfordschoolpatios.com", "123456"],
      ["student", "tafur@gmail.com", "123456"],
    ] as const) {
      const client = createClient(url, anon);
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (!error) pass(`Login ${label}`, email);
      else fail(`Login ${label}`, error.message);
    }

    // Short password rejected
    {
      const client = createClient(url, anon);
      const { error } = await client.auth.signUp({
        email: `short-${stamp}@test.local`,
        password: "1234567",
      });
      if (error) pass("Short password rejected", error.message);
      else fail("Short password rejected", "signup succeeded");
    }

    // Create pending-approval student
    {
      const { data, error } = await admin.auth.admin.createUser({
        email: newEmail,
        password: newPass,
        email_confirm: true,
        user_metadata: { full_name: "E2E New Student" },
      });
      if (error || !data.user) {
        fail("Create pending student", error?.message);
      } else {
        newUserId = data.user.id;
        await admin.from("profiles").upsert({
          id: newUserId,
          role: "student",
          full_name: "E2E New Student",
          requires_enrollment_approval: true,
        });
        pass("Create pending student", newEmail);

        const client = createClient(url, anon);
        const { error: loginErr } = await client.auth.signInWithPassword({
          email: newEmail,
          password: newPass,
        });
        if (!loginErr) pass("Login new student");
        else fail("Login new student", loginErr.message);

        const { data: course } = await admin
          .from("courses")
          .select("id, title")
          .eq("published", true)
          .eq("level", "A1")
          .limit(1)
          .single();
        const { data: group } = await admin
          .from("course_groups")
          .select("id")
          .eq("course_id", course!.id)
          .eq("is_active", true)
          .order("sort_order")
          .limit(1)
          .maybeSingle();

        // Student can read groups (migration 0033)
        const { data: studentGroups, error: sgErr } = await client
          .from("course_groups")
          .select("id")
          .eq("course_id", course!.id);
        if (!sgErr && (studentGroups?.length ?? 0) > 0) {
          pass("Student can read published course groups", `count=${studentGroups!.length}`);
        } else {
          fail("Student can read published course groups", sgErr?.message ?? "empty");
        }

        const { data: pending, error: pendErr } = await client
          .from("course_enrollments")
          .insert({
            course_id: course!.id,
            student_id: newUserId,
            group_id: group!.id,
            status: "pending",
          })
          .select("id, status")
          .single();
        if (!pendErr && pending?.status === "pending") {
          pendingEnrollmentId = pending.id;
          pass("Pending enrollment insert (new student)", course!.title);
        } else {
          fail("Pending enrollment insert", pendErr?.message);
        }

        const pendingQ = await admin
          .from("course_enrollments")
          .select("*, courses(*, languages(*)), profiles!student_id(*)")
          .eq("status", "pending");
        if (!pendingQ.error && (pendingQ.data ?? []).some((e) => e.id === pendingEnrollmentId)) {
          pass("Admin pending list includes new enrollment");
        } else {
          fail("Admin pending list", pendingQ.error?.message ?? "not found");
        }

        if (pendingEnrollmentId) {
          const { error: apprErr } = await admin
            .from("course_enrollments")
            .update({ status: "active" })
            .eq("id", pendingEnrollmentId);
          if (!apprErr) pass("Admin approve enrollment");
          else fail("Admin approve enrollment", apprErr.message);

          const { data: content } = await admin
            .from("course_content")
            .select("content_type, external_url, storage_path")
            .eq("course_id", course!.id);
          let yt = 0;
          let pdf = 0;
          for (const item of content ?? []) {
            if (item.content_type === "youtube" && item.external_url) {
              const r = await fetch(
                `https://www.youtube.com/oembed?url=${encodeURIComponent(item.external_url)}&format=json`,
              );
              if (r.ok) yt++;
            }
            if (item.content_type === "pdf" && item.storage_path) {
              const s = await admin.storage.from("courses").createSignedUrl(item.storage_path, 60);
              if (!s.error) pdf++;
            }
          }
          if (yt > 0) pass("YouTube content accessible", `count=${yt}`);
          else fail("YouTube content accessible");
          if (pdf > 0) pass("PDF content accessible", `count=${pdf}`);
          else fail("PDF content accessible");

          const { count: examCount } = await admin
            .from("exams")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course!.id);
          pass("Exams for course (may be 0)", `count=${examCount ?? 0}`);
        }
      }
    }

    // Auto-approve student enroll
    {
      const { data, error } = await admin.auth.admin.createUser({
        email: autoEmail,
        password: newPass,
        email_confirm: true,
      });
      if (error || !data.user) {
        fail("Create auto-approve student", error?.message);
      } else {
        autoUserId = data.user.id;
        await admin.from("profiles").upsert({
          id: autoUserId,
          role: "student",
          full_name: "E2E Auto Student",
          requires_enrollment_approval: false,
        });
        const client = createClient(url, anon);
        await client.auth.signInWithPassword({ email: autoEmail, password: newPass });
        const { data: course } = await admin
          .from("courses")
          .select("id")
          .eq("published", true)
          .limit(1)
          .single();
        const { data: group } = await admin
          .from("course_groups")
          .select("id")
          .eq("course_id", course!.id)
          .limit(1)
          .single();
        const { data: enroll, error: eErr } = await client
          .from("course_enrollments")
          .insert({
            course_id: course!.id,
            student_id: autoUserId,
            group_id: group!.id,
            status: "active",
          })
          .select("id, status")
          .single();
        if (!eErr && enroll?.status === "active") pass("Auto-approve self-enroll active");
        else fail("Auto-approve self-enroll", eErr?.message);
        if (enroll) await admin.from("course_enrollments").delete().eq("id", enroll.id);
      }
    }

    // DB integrity
    {
      const { count } = await admin
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("published", true)
        .eq("level", "A1");
      if (count === 10) pass("DB 10 A1 courses");
      else fail("DB 10 A1 courses", `count=${count}`);
    }
  } finally {
    if (pendingEnrollmentId) {
      await admin.from("course_enrollments").delete().eq("id", pendingEnrollmentId);
    }
    if (newUserId) {
      await admin.from("course_enrollments").delete().eq("student_id", newUserId);
      await admin.auth.admin.deleteUser(newUserId);
      pass("Cleanup pending student");
    }
    if (autoUserId) {
      await admin.from("course_enrollments").delete().eq("student_id", autoUserId);
      await admin.auth.admin.deleteUser(autoUserId);
      pass("Cleanup auto student");
    }
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(
    JSON.stringify(
      {
        total: checks.length,
        passed: checks.length - failed.length,
        failed: failed.length,
        checks,
      },
      null,
      2,
    ),
  );
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
