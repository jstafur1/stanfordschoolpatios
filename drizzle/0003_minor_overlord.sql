ALTER TYPE "public"."content_type" ADD VALUE 'powerpoint' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."content_type" ADD VALUE 'video' BEFORE 'other';--> statement-breakpoint
DROP TABLE "course_appointment_schedules" CASCADE;--> statement-breakpoint
DROP TABLE "course_appointments" CASCADE;--> statement-breakpoint
DROP TYPE "public"."appointment_modality";--> statement-breakpoint
DROP TYPE "public"."appointment_status";--> statement-breakpoint
DROP TYPE "public"."schedule_modality_default";