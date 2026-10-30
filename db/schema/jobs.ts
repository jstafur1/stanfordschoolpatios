import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  applicationStatusEnum,
  employmentTypeEnum,
  jobStatusEnum,
  workModeEnum,
} from "./enums";
import { profiles } from "./profiles";

export const jobPostings = pgTable("job_postings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  benefits: text("benefits"),
  employmentType: employmentTypeEnum("employment_type").notNull(),
  workMode: workModeEnum("work_mode").notNull(),
  location: text("location"),
  salaryMin: numeric("salary_min", { precision: 12, scale: 2 }),
  salaryMax: numeric("salary_max", { precision: 12, scale: 2 }),
  salaryCurrency: text("salary_currency").default("EUR"),
  showSalary: boolean("show_salary").notNull().default(false),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  applicationDeadline: timestamp("application_deadline", {
    withTimezone: true,
  }),
  status: jobStatusEnum("status").notNull().default("draft"),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobPostingId: uuid("job_posting_id")
    .notNull()
    .references(() => jobPostings.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  yearsOfExperience: integer("years_of_experience"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  availabilityStartDate: date("availability_start_date"),
  coverLetter: text("cover_letter"),
  cvStoragePath: text("cv_storage_path"),
  cvOriginalFilename: text("cv_original_filename"),
  status: applicationStatusEnum("status").notNull().default("new"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
