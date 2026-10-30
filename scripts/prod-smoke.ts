import { config } from "dotenv";
import { createAdminClient } from "../lib/supabase/admin-client";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config({ path: ".env" });

const BASE = process.env.PROD_BASE_URL ?? "https://stanfordschoolpatios.vercel.app";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

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
    if (res.status === 307 || res.status === 302) {
      if (location.includes("/login")) return { ok: true, status: res.status, location };
      return { ok: false, status: res.status, location };
    }
    return { ok: false, status: res.status, location };
  }
  return { ok: res.status === 200, status: res.status, location };
}

async function login(email: string, password: string) {
  const client = createClient(supabaseUrl, publishableKey);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) return null;
  return data.session;
}

async function authedFetch(path: string, accessToken: string) {
  return fetch(`${BASE}${path}`, {
    headers: { Cookie: `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token=...` },
    redirect: "manual",
  });
}

async function main() {
  // Public pages
  for (const path of ["/es", "/en", "/fr", "/es/login", "/es/register", "/es/about"]) {
    const r = await fetchStatus(path);
    if (r.ok) pass(`GET ${path}`, String(r.status));
    else fail(`GET ${path}`, `status=${r.status}`);
  }

  // Landing catalog
  const landing = await fetch(`${BASE}/es`).then((r) => r.text());
  const courseCount = (landing.match(/Inglés A1/g) ?? []).length;
  if (courseCount >= 10) pass("Landing shows A1 courses", `matches=${courseCount}`);
  else fail("Landing shows A1 courses", `matches=${courseCount}`);

  // Auth gates
  for (const path of ["/student", "/admin", "/admin/students", "/teacher"]) {
    const r = await fetchStatus(path, true);
    if (r.ok) pass(`Auth gate ${path}`, r.location);
    else fail(`Auth gate ${path}`, `status=${r.status} loc=${r.location}`);
  }

  const admin = createAdminClient();

  // DB integrity
  const { count: courses } = await admin
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("published", true)
    .eq("level", "A1");
  if (courses === 10) pass("DB: 10 published A1 courses");
  else fail("DB: 10 published A1 courses", `count=${courses}`);

  const { count: groups } = await admin
    .from("course_groups")
    .select("*", { count: "exact", head: true });
  if ((groups ?? 0) >= 10) pass("DB: course groups exist", `count=${groups}`);
  else fail("DB: course groups exist", `count=${groups}`);

  const { data: content } = await admin.from("course_content").select("content_type");
  const youtube = content?.filter((c) => c.content_type === "youtube").length ?? 0;
  const pdf = content?.filter((c) => c.content_type === "pdf").length ?? 0;
  if (youtube >= 10 && pdf >= 10) pass("DB: YouTube + PDF content", `yt=${youtube} pdf=${pdf}`);
  else fail("DB: YouTube + PDF content", `yt=${youtube} pdf=${pdf}`);

  const { data: students } = await admin
    .from("profiles")
    .select("requires_enrollment_approval")
    .eq("role", "student");
  const autoApprove = students?.filter((s) => !s.requires_enrollment_approval).length ?? 0;
  if (autoApprove === (students?.length ?? 0)) pass("DB: existing students auto-approve", `count=${autoApprove}`);
  else fail("DB: existing students auto-approve", `auto=${autoApprove} total=${students?.length}`);

  // Pending enrollments query (was crashing admin)
  const pendingQ = await admin
    .from("course_enrollments")
    .select("*, courses(*, languages(*)), profiles!student_id(*)")
    .eq("status", "pending");
  if (!pendingQ.error) pass("DB: pending enrollments query");
  else fail("DB: pending enrollments query", pendingQ.error.message);

  // Migrations sanity
  const { error: pendingEnum } = await admin
    .from("course_enrollments")
    .select("status")
    .eq("status", "pending")
    .limit(1);
  if (!pendingEnum) pass("DB: pending status enum works");
  else fail("DB: pending status enum works", pendingEnum.message);

  const email = process.env.PROD_ADMIN_EMAIL ?? "administracion@stanfordschoolpatios.com";
  const password = process.env.PROD_ADMIN_PASSWORD ?? process.env.ADMIN_SEED_PASSWORD ?? "123456";
  const session = await login(email, password);
  if (session) pass("Admin login", email);
  else fail("Admin login", email);

  const studentEmail = process.env.PROD_STUDENT_EMAIL;
  const studentPassword = process.env.PROD_STUDENT_PASSWORD;
  if (studentEmail && studentPassword) {
    const studentSession = await login(studentEmail, studentPassword);
    if (studentSession) pass("Student login", studentEmail);
    else fail("Student login", studentEmail);
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(JSON.stringify({ base: BASE, total: checks.length, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
