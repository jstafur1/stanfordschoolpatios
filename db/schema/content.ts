import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { contentTypeEnum } from "./enums";
import { courses } from "./courses";

export const courseContent = pgTable("course_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  contentType: contentTypeEnum("content_type").notNull(),
  /** Path inside Supabase storage bucket `courses` */
  storagePath: text("storage_path"),
  /** YouTube or other external URLs */
  externalUrl: text("external_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
