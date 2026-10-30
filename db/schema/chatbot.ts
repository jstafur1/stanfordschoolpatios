import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { chatMessageRoleEnum } from "./enums";
import { courses } from "./courses";
import { profiles } from "./profiles";

export const courseChatbotConfigs = pgTable("course_chatbot_configs", {
  courseId: uuid("course_id")
    .primaryKey()
    .references(() => courses.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(false),
  systemInstructions: text("system_instructions").notNull().default(""),
  welcomeMessage: text("welcome_message"),
  model: text("model")
    .notNull()
    .default("meta/llama-3.1-8b-instruct"),
  temperature: real("temperature").notNull().default(0.1),
  topP: real("top_p").notNull().default(0.7),
  maxTokens: integer("max_tokens").notNull().default(1024),
  updatedBy: uuid("updated_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const courseChatMessages = pgTable(
  "course_chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: chatMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    clientRequestId: uuid("client_request_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("course_chat_messages_course_user_created_idx").on(
      table.courseId,
      table.userId,
      table.createdAt,
    ),
    uniqueIndex("course_chat_messages_client_request_uidx")
      .on(table.courseId, table.userId, table.clientRequestId)
      .where(sql`${table.clientRequestId} IS NOT NULL`),
  ],
);

export const courseChatInflightLocks = pgTable(
  "course_chat_inflight_locks",
  {
    id: uuid("id").primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("course_chat_inflight_locks_course_user_uidx").on(
      table.courseId,
      table.userId,
    ),
    index("course_chat_inflight_locks_expires_idx").on(table.expiresAt),
  ],
);
