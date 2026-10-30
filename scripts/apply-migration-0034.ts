/**
 * Apply migration 0034_restore_job_postings.sql to the linked Supabase DB.
 * Run: npx tsx scripts/apply-migration-0034.ts
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const connectionString =
    process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error(
      "Set DATABASE_URL or SUPABASE_DB_URL in .env (Supabase → Settings → Database → connection string)",
    );
    process.exit(1);
  }

  const sqlPath = path.join(
    process.cwd(),
    "supabase/migrations/0034_restore_job_postings.sql",
  );
  const sql = fs.readFileSync(sqlPath, "utf8");
  const sqlClient = postgres(connectionString, {
    prepare: false,
    ssl: "require",
  });

  try {
    await sqlClient.unsafe(sql);
    console.log("Applied 0034_restore_job_postings.sql successfully.");
  } finally {
    await sqlClient.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
