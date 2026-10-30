ALTER TYPE "public"."content_type" ADD VALUE 'audio' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."enrollment_status" ADD VALUE 'pending';--> statement-breakpoint
CREATE TABLE "course_chat_inflight_locks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_chatbot_configs" ALTER COLUMN "model" SET DEFAULT 'meta/llama-3.1-8b-instruct';--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "requires_enrollment_approval" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "course_chat_messages" ADD COLUMN "client_request_id" uuid;--> statement-breakpoint
ALTER TABLE "course_chat_inflight_locks" ADD CONSTRAINT "course_chat_inflight_locks_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_chat_inflight_locks" ADD CONSTRAINT "course_chat_inflight_locks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_chat_inflight_locks_course_user_uidx" ON "course_chat_inflight_locks" USING btree ("course_id","user_id");--> statement-breakpoint
CREATE INDEX "course_chat_inflight_locks_expires_idx" ON "course_chat_inflight_locks" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "course_chat_messages_client_request_uidx" ON "course_chat_messages" USING btree ("course_id","user_id","client_request_id") WHERE "course_chat_messages"."client_request_id" IS NOT NULL;