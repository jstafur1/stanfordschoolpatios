import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { attemptStatusEnum, questionTypeEnum } from "./enums";
import { courses } from "./courses";
import { profiles } from "./profiles";

export const exams = pgTable("exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  timeLimitMinutes: integer("time_limit_minutes"),
  maxAttempts: integer("max_attempts").notNull().default(1),
  passThresholdPercent: integer("pass_threshold_percent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const examQuestions = pgTable("exam_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  questionType: questionTypeEnum("question_type").notNull(),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  attachmentPath: text("attachment_path"),
});

export const examQuestionOptions = pgTable("exam_question_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => examQuestions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const examAttempts = pgTable("exam_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  status: attemptStatusEnum("status").notNull().default("in_progress"),
  scorePercent: integer("score_percent"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});

export const examAnswers = pgTable("exam_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => examAttempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => examQuestions.id, { onDelete: "cascade" }),
  selectedOptionIds: jsonb("selected_option_ids").$type<string[]>(),
  openText: text("open_text"),
  isCorrect: boolean("is_correct"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
});
