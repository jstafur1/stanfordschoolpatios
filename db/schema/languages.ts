import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const languages = pgTable("languages", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Legacy display field — kept in sync with nameEs */
  name: text("name").notNull(),
  nameEs: text("name_es").notNull(),
  nameEn: text("name_en").notNull(),
  nameFr: text("name_fr").notNull(),
  code: text("code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
