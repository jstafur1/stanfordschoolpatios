"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth/guards";
import { actionError, actionFail, type ActionResult } from "@/lib/actions/result";
import { canManageCourse } from "@/lib/permissions/courses";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/nvidia";
import {
  clearChatMessages,
  upsertChatbotConfig,
} from "@/lib/services/chatbot.service";

const chatbotConfigSchema = z.object({
  courseId: z.string().uuid(),
  enabled: z.boolean(),
  systemInstructions: z.string().max(8000),
  welcomeMessage: z.string().max(2000).optional(),
  model: z.string().min(1).max(200),
  temperature: z.coerce.number().min(0).max(2),
  topP: z.coerce.number().min(0).max(1),
  maxTokens: z.coerce.number().int().min(128).max(4096),
});

function revalidateChatbotPaths(courseId: string) {
  revalidatePath(`/admin/courses/${courseId}/chatbot`);
  revalidatePath(`/teacher/courses/${courseId}/chatbot`);
  revalidatePath(`/student/courses/${courseId}/practice`);
  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath(`/teacher/courses/${courseId}`);
}

export async function updateChatbotConfigAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireAuth();
    const courseId = String(formData.get("courseId") ?? "");
    const allowed = await canManageCourse(
      profile.id,
      profile.role,
      courseId,
    );
    if (!allowed) return actionFail("forbidden");

    const parsed = chatbotConfigSchema.safeParse({
      courseId,
      enabled: formData.get("enabled") === "on",
      systemInstructions: String(formData.get("systemInstructions") ?? ""),
      welcomeMessage: String(formData.get("welcomeMessage") ?? "").trim(),
      model: String(formData.get("model") ?? DEFAULT_CHAT_MODEL),
      temperature: formData.get("temperature") ?? 0.1,
      topP: formData.get("topP") ?? 0.7,
      maxTokens: formData.get("maxTokens") ?? 1024,
    });

    if (!parsed.success) {
      return actionFail("generic");
    }

    const { welcomeMessage, ...rest } = parsed.data;
    await upsertChatbotConfig(profile.id, profile.role, courseId, {
      ...rest,
      welcomeMessage: welcomeMessage || null,
    });

    revalidateChatbotPaths(courseId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function clearChatHistoryAction(
  courseId: string,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("student");
    await clearChatMessages(courseId, profile.id);
    revalidatePath(`/student/courses/${courseId}/practice`);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}
