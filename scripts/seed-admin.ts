import { config } from "dotenv";
import { createAdminClient } from "../lib/supabase/admin-client";
import { ADMIN_EMAIL } from "../lib/auth/roles";

config({ path: ".env.local" });
config({ path: ".env" });

const ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "12345678";

async function seedAdmin() {
  const admin = createAdminClient();

  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  );

  if (existing) {
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existing.id,
      {
        email_confirm: true,
        user_metadata: { role: "admin", full_name: "Administración" },
      },
    );
    if (updateError) throw updateError;

    const { error: profileError } = await admin
      .from("profiles")
      .update({ role: "admin", full_name: "Administración" })
      .eq("id", existing.id);

    if (profileError) throw profileError;

    console.log(`Admin already exists (${ADMIN_EMAIL}), role ensured.`);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { role: "admin", full_name: "Administración" },
  });

  if (error) throw error;

  console.log(`Created admin: ${ADMIN_EMAIL} (id: ${data.user.id})`);
  console.log("Change the password before production.");
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
