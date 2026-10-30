import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { courses } from "./courses";
import { profiles } from "./profiles";

export const courseGroups = pgTable(
  "course_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    maxStudents: integer("max_students"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("course_groups_course_name_unique").on(table.courseId, table.name),
  ],
);

export const groupTeachers = pgTable(
  "group_teachers",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => courseGroups.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("group_teachers_group_teacher_unique").on(
      table.groupId,
      table.teacherId,
    ),
  ],
);
