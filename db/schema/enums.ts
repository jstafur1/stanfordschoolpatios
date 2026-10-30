import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "student", "teacher"]);

export const contentTypeEnum = pgEnum("content_type", [
  "pdf",
  "youtube",
  "image",
  "excel",
  "word",
  "powerpoint",
  "video",
  "audio",
  "other",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "single_choice",
  "multiple_choice",
  "true_false",
  "open",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "completed",
  "suspended",
  "pending",
]);

export const completionStatusEnum = pgEnum("completion_status", [
  "in_progress",
  "pending_review",
  "passed",
  "failed",
]);

export const attemptStatusEnum = pgEnum("attempt_status", [
  "in_progress",
  "submitted",
  "passed",
  "failed",
  "pending_review",
]);

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user",
  "assistant",
]);

export const courseLevelEnum = pgEnum("course_level", [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
]);

export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
]);

export const workModeEnum = pgEnum("work_mode", [
  "on_site",
  "remote",
  "hybrid",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "draft",
  "published",
  "closed",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "new",
  "reviewed",
  "rejected",
  "hired",
]);
