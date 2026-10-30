import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { courses } from "./courses";
import { profiles } from "./profiles";

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  actorId: uuid("actor_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id"),
  courseId: uuid("course_id").references(() => courses.id, {
    onDelete: "set null",
  }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
