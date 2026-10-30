import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { completionStatusEnum, enrollmentStatusEnum } from "./enums";
import { courseContent } from "./content";
import { courseGroups } from "./groups";
import { courses } from "./courses";
import { profiles } from "./profiles";

export const courseEnrollments = pgTable(
  "course_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").references(() => courseGroups.id, {
      onDelete: "set null",
    }),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    completionStatus: completionStatusEnum("completion_status")
      .notNull()
      .default("in_progress"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("course_enrollments_course_student_unique").on(
      table.courseId,
      table.studentId,
    ),
  ],
);

export const contentViews = pgTable(
  "content_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => courseEnrollments.id, { onDelete: "cascade" }),
    contentId: uuid("content_id")
      .notNull()
      .references(() => courseContent.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("content_views_enrollment_content_unique").on(
      table.enrollmentId,
      table.contentId,
    ),
  ],
);
