import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { courseLevelEnum } from "./enums";
import { profiles } from "./profiles";
import { languages } from "./languages";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Legacy display field — kept in sync with titleEs */
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr").notNull(),
  /** Legacy display field — kept in sync with descriptionEs */
  description: text("description"),
  descriptionEs: text("description_es"),
  descriptionEn: text("description_en"),
  descriptionFr: text("description_fr"),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  languageId: uuid("language_id").references(() => languages.id, {
    onDelete: "set null",
  }),
  level: courseLevelEnum("level"),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const courseTags = pgTable(
  "course_tags",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.courseId, table.tagId] })],
);
