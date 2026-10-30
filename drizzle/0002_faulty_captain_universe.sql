CREATE TYPE "public"."application_status" AS ENUM('new', 'reviewed', 'rejected', 'hired');--> statement-breakpoint
CREATE TYPE "public"."appointment_modality" AS ENUM('in_person', 'virtual');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."chat_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract', 'internship', 'temporary');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'closed');--> statement-breakpoint
CREATE TYPE "public"."schedule_modality_default" AS ENUM('in_person', 'virtual', 'student_choice');--> statement-breakpoint
CREATE TYPE "public"."work_mode" AS ENUM('on_site', 'remote', 'hybrid');--> statement-breakpoint
CREATE TABLE "course_appointment_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_duration_minutes" integer DEFAULT 30 NOT NULL,
	"default_modality" "schedule_modality_default" DEFAULT 'student_choice' NOT NULL,
	"default_room" text,
	"default_meeting_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"schedule_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"modality" "appointment_modality" NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"room" text,
	"meeting_url" text,
	"student_note" text,
	"teacher_note" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_posting_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"years_of_experience" integer,
	"linkedin_url" text,
	"portfolio_url" text,
	"availability_start_date" date,
	"cover_letter" text,
	"cv_storage_path" text,
	"cv_original_filename" text,
	"status" "application_status" DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text,
	"benefits" text,
	"employment_type" "employment_type" NOT NULL,
	"work_mode" "work_mode" NOT NULL,
	"location" text,
	"salary_min" numeric(12, 2),
	"salary_max" numeric(12, 2),
	"salary_currency" text DEFAULT 'EUR',
	"show_salary" boolean DEFAULT false NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"application_deadline" timestamp with time zone,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "chat_message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_chatbot_configs" (
	"course_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"system_instructions" text DEFAULT '' NOT NULL,
	"welcome_message" text,
	"model" text DEFAULT 'microsoft/phi-4-mini-instruct' NOT NULL,
	"temperature" real DEFAULT 0.1 NOT NULL,
	"top_p" real DEFAULT 0.7 NOT NULL,
	"max_tokens" integer DEFAULT 1024 NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "languages" ADD COLUMN "name_es" text NOT NULL;--> statement-breakpoint
ALTER TABLE "languages" ADD COLUMN "name_en" text NOT NULL;--> statement-breakpoint
ALTER TABLE "languages" ADD COLUMN "name_fr" text NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "title_es" text NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "title_en" text NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "title_fr" text NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "description_es" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "description_fr" text;--> statement-breakpoint
ALTER TABLE "course_appointment_schedules" ADD CONSTRAINT "course_appointment_schedules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_appointment_schedules" ADD CONSTRAINT "course_appointment_schedules_teacher_id_profiles_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_appointments" ADD CONSTRAINT "course_appointments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_appointments" ADD CONSTRAINT "course_appointments_teacher_id_profiles_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_appointments" ADD CONSTRAINT "course_appointments_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_appointments" ADD CONSTRAINT "course_appointments_schedule_id_course_appointment_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."course_appointment_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_appointments" ADD CONSTRAINT "course_appointments_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_appointments" ADD CONSTRAINT "course_appointments_cancelled_by_profiles_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_chat_messages" ADD CONSTRAINT "course_chat_messages_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_chat_messages" ADD CONSTRAINT "course_chat_messages_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_chatbot_configs" ADD CONSTRAINT "course_chatbot_configs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_chatbot_configs" ADD CONSTRAINT "course_chatbot_configs_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_chat_messages_course_user_created_idx" ON "course_chat_messages" USING btree ("course_id","user_id","created_at");