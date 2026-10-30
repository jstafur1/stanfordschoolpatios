import "server-only";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/nvidia";
import { canManageCourse } from "@/lib/permissions/courses";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabase, throwOnError } from "@/lib/supabase/server-query";
import {
  mapChatMessage,
  mapChatbotConfig,
  type ChatMessage,
  type ChatMessageRow,
  type ChatbotConfig,
  type ChatbotConfigRow,
} from "@/lib/supabase/mappers";
import { getCourseById } from "@/lib/services/courses.service";
import { getStudentCourseIds } from "@/lib/services/enrollments.service";
import { localizedCourseTitle } from "@/lib/i18n/localized-content";

export const MAX_CHAT_MESSAGE_LENGTH = 4000;
export const CHAT_INFLIGHT_LOCK_TTL_MS = 5 * 60 * 1000;

export type ChatInflightLock = {
  id: string;
  courseId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
};

export type AcquireChatInflightLockResult =
  | { ok: true }
  | { ok: false; reason: "in_flight"; existingRequestId: string }
  | { ok: false; reason: "same_request"; existingRequestId: string };

type ChatInflightLockRow = {
  id: string;
  course_id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
};

function mapChatInflightLock(row: ChatInflightLockRow): ChatInflightLock {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
  };
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

function isInflightLocksUnavailable(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return (
    message.includes("course_chat_inflight_locks") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("Could not find"))
  );
}

function isClientRequestIdUnavailable(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return (
    message.includes("client_request_id") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("Could not find"))
  );
}

export type ChatbotConfigInput = {
  enabled: boolean;
  systemInstructions: string;
  welcomeMessage?: string | null;
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
};

function defaultConfig(courseId: string): ChatbotConfig {
  return {
    courseId,
    enabled: false,
    systemInstructions: "",
    welcomeMessage: null,
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.1,
    topP: 0.7,
    maxTokens: 1024,
    updatedBy: null,
    updatedAt: new Date(),
  };
}

async function getChatbotConfigRow(courseId: string): Promise<ChatbotConfigRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("course_chatbot_configs")
    .select("*")
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ChatbotConfigRow | null;
}

export async function getChatbotConfig(
  courseId: string,
): Promise<ChatbotConfig> {
  const data = await getChatbotConfigRow(courseId);
  return data ? mapChatbotConfig(data) : defaultConfig(courseId);
}

export async function upsertChatbotConfig(
  userId: string,
  role: string,
  courseId: string,
  input: ChatbotConfigInput,
): Promise<ChatbotConfig> {
  const allowed = await canManageCourse(userId, role, courseId);
  if (!allowed) throw new Error("Forbidden");

  const admin = createAdminClient();
  const payload = {
    course_id: courseId,
    enabled: input.enabled,
    system_instructions: input.systemInstructions.trim(),
    welcome_message: input.welcomeMessage?.trim() || null,
    model: input.model?.trim() || DEFAULT_CHAT_MODEL,
    temperature: input.temperature ?? 0.1,
    top_p: input.topP ?? 0.7,
    max_tokens: input.maxTokens ?? 1024,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  const data = throwOnError<ChatbotConfigRow>(
    "upsertChatbotConfig",
    await admin
      .from("course_chatbot_configs")
      .upsert(payload, { onConflict: "course_id" })
      .select("*")
      .single(),
  );

  return mapChatbotConfig(data);
}

export async function listChatMessages(
  courseId: string,
  userId: string,
): Promise<ChatMessage[]> {
  const supabase = await getSupabase();
  const data = throwOnError<ChatMessageRow[]>(
    "listChatMessages",
    await supabase
      .from("course_chat_messages")
      .select("*")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  );

  return data.map(mapChatMessage);
}

export async function appendChatMessage(
  courseId: string,
  userId: string,
  role: "user" | "assistant",
  content: string,
  clientRequestId?: string,
): Promise<ChatMessage> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message content is required");
  if (trimmed.length > MAX_CHAT_MESSAGE_LENGTH) {
    throw new Error("Message is too long");
  }

  const supabase = await getSupabase();
  const payload = {
    course_id: courseId,
    user_id: userId,
    role,
    content: trimmed,
    ...(clientRequestId ? { client_request_id: clientRequestId } : {}),
  };

  const { data, error } = await supabase
    .from("course_chat_messages")
    .insert(payload)
    .select("*")
    .single();

  if (!error && data) {
    return mapChatMessage(data as ChatMessageRow);
  }

  if (clientRequestId && isUniqueViolation(error)) {
    const existing = throwOnError<ChatMessageRow>(
      "getChatMessageByClientRequestId",
      await supabase
        .from("course_chat_messages")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", userId)
        .eq("client_request_id", clientRequestId)
        .single(),
    );
    return mapChatMessage(existing);
  }

  if (clientRequestId && isClientRequestIdUnavailable(error)) {
    const data = throwOnError<ChatMessageRow>(
      "appendChatMessage",
      await supabase
        .from("course_chat_messages")
        .insert({
          course_id: courseId,
          user_id: userId,
          role,
          content: trimmed,
        })
        .select("*")
        .single(),
    );
    return mapChatMessage(data);
  }

  throw new Error(error?.message ?? "Failed to save message");
}

export async function clearChatMessages(
  courseId: string,
  userId: string,
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("course_chat_messages")
    .delete()
    .eq("course_id", courseId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  await releaseChatInflightLock(courseId, userId);
}

export async function cleanupExpiredChatInflightLocks(
  courseId: string,
  userId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("course_chat_inflight_locks")
    .delete()
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .lt("expires_at", new Date().toISOString());

  if (error) {
    if (isInflightLocksUnavailable(error)) return;
    throw new Error(error.message);
  }
}

export async function getChatInflightLock(
  courseId: string,
  userId: string,
): Promise<ChatInflightLock | null> {
  await cleanupExpiredChatInflightLocks(courseId, userId);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("course_chat_inflight_locks")
    .select("*")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isInflightLocksUnavailable(error)) return null;
    throw new Error(error.message);
  }
  if (!data) return null;

  const lock = mapChatInflightLock(data as ChatInflightLockRow);
  if (lock.expiresAt.getTime() <= Date.now()) {
    await releaseChatInflightLock(courseId, userId);
    return null;
  }

  return lock;
}

export async function acquireChatInflightLock(
  courseId: string,
  userId: string,
  idempotencyKey: string,
): Promise<AcquireChatInflightLockResult> {
  await cleanupExpiredChatInflightLocks(courseId, userId);

  const existing = await getChatInflightLock(courseId, userId);
  if (existing) {
    if (existing.id === idempotencyKey) {
      return {
        ok: false,
        reason: "same_request",
        existingRequestId: existing.id,
      };
    }
    return {
      ok: false,
      reason: "in_flight",
      existingRequestId: existing.id,
    };
  }

  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + CHAT_INFLIGHT_LOCK_TTL_MS).toISOString();
  const { error } = await admin.from("course_chat_inflight_locks").insert({
    id: idempotencyKey,
    course_id: courseId,
    user_id: userId,
    expires_at: expiresAt,
  });

  if (!error) {
    return { ok: true };
  }

  if (isInflightLocksUnavailable(error)) {
    return { ok: true };
  }

  if (isUniqueViolation(error)) {
    const raced = await getChatInflightLock(courseId, userId);
    if (!raced) {
      return { ok: true };
    }
    if (raced.id === idempotencyKey) {
      return {
        ok: false,
        reason: "same_request",
        existingRequestId: raced.id,
      };
    }
    return {
      ok: false,
      reason: "in_flight",
      existingRequestId: raced.id,
    };
  }

  throw new Error(error.message);
}

export async function releaseChatInflightLock(
  courseId: string,
  userId: string,
  idempotencyKey?: string,
): Promise<void> {
  const admin = createAdminClient();
  let query = admin
    .from("course_chat_inflight_locks")
    .delete()
    .eq("course_id", courseId)
    .eq("user_id", userId);

  if (idempotencyKey) {
    query = query.eq("id", idempotencyKey);
  }

  const { error } = await query;
  if (error && !isInflightLocksUnavailable(error)) {
    throw new Error(error.message);
  }
}

export async function hasChatInflightLock(
  courseId: string,
  userId: string,
): Promise<boolean> {
  const lock = await getChatInflightLock(courseId, userId);
  return lock !== null;
}

export async function assertStudentCanChat(
  userId: string,
  role: string,
  courseId: string,
): Promise<ChatbotConfig> {
  if (role !== "student") {
    throw new Error("Forbidden");
  }

  const [course, enrolledIds, configRow] = await Promise.all([
    getCourseById(courseId),
    getStudentCourseIds(userId),
    getChatbotConfigRow(courseId),
  ]);
  const config = configRow
    ? mapChatbotConfig(configRow)
    : defaultConfig(courseId);

  if (!course || !course.published || !enrolledIds.includes(courseId)) {
    throw new Error("This course is not available yet");
  }

  if (!config.enabled) {
    throw new Error("Practice chatbot is not enabled for this course");
  }

  return config;
}

export function buildSystemPrompt(
  config: ChatbotConfig,
  courseTitle: string,
): string {
  const baseline = `You are a patient practice tutor for the course "${courseTitle}". Help the student review concepts, ask guiding questions, and give feedback. Do not provide exam answers directly. Respond in the course language when possible.`;

  const custom = config.systemInstructions.trim();
  return custom ? `${baseline}\n\n${custom}` : baseline;
}

export async function resolveChatSystemPrompt(
  courseId: string,
  config: ChatbotConfig,
): Promise<string> {
  const course = await getCourseById(courseId);
  const courseTitle = course ? localizedCourseTitle(course) : "this course";
  return buildSystemPrompt(config, courseTitle);
}

export function toUiMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: [{ type: "text" as const, text: message.content }],
  }));
}
