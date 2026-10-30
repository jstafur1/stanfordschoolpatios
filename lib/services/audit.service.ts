import "server-only";
import { getSupabase, throwOnError } from "@/lib/supabase/server-query";
import { mapAuditEvent } from "@/lib/supabase/mappers";

export type AuditEventInput = {
  eventType: string;
  actorId: string;
  targetType: string;
  targetId?: string | null;
  courseId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAuditEvent(input: AuditEventInput) {
  const supabase = await getSupabase();
  const { error } = await supabase.from("audit_events").insert({
    event_type: input.eventType,
    actor_id: input.actorId,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    course_id: input.courseId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) throw new Error(error.message);
}

export async function listAuditEventsForCourse(courseId: string, limit = 100) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listAuditEventsForCourse",
    await supabase
      .from("audit_events")
      .select("*, profiles:actor_id(full_name)")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })
      .limit(limit),
  );

  return data.map((row) => {
    const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      event: mapAuditEvent(row),
      actorName: (profileRow?.full_name as string | null) ?? null,
    };
  });
}
