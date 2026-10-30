import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";

/** Extends Supabase auth.users — id must match auth user id */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  role: userRoleEnum("role").notNull().default("student"),
  requiresEnrollmentApproval: boolean("requires_enrollment_approval")
    .notNull()
    .default(true),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
