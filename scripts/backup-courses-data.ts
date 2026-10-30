import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "dotenv";
import { createAdminClient } from "../lib/supabase/admin-client";

config({ path: ".env.local" });
config({ path: ".env" });

async function backupCoursesData() {
  const admin = createAdminClient();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const [courses, content, enrollments, groups, languages] = await Promise.all([
    admin.from("courses").select("*"),
    admin.from("course_content").select("*"),
    admin.from("course_enrollments").select("*"),
    admin.from("course_groups").select("*"),
    admin.from("languages").select("*"),
  ]);

  for (const result of [courses, content, enrollments, groups, languages]) {
    if (result.error) throw result.error;
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    counts: {
      courses: courses.data?.length ?? 0,
      content: content.data?.length ?? 0,
      enrollments: enrollments.data?.length ?? 0,
      groups: groups.data?.length ?? 0,
      languages: languages.data?.length ?? 0,
    },
    courses: courses.data ?? [],
    course_content: content.data ?? [],
    course_enrollments: enrollments.data ?? [],
    course_groups: groups.data ?? [],
    languages: languages.data ?? [],
  };

  const dir = join(process.cwd(), "scripts", "backups");
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, `courses-backup-${timestamp}.json`);
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");

  console.log(`Backup saved: ${filePath}`);
  console.log(JSON.stringify(payload.counts, null, 2));
}

backupCoursesData().catch((error) => {
  console.error(error);
  process.exit(1);
});
