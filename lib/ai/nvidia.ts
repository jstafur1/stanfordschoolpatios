import "server-only";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Llama responds reliably on NIM; phi-4 often hangs with no response. */
export const DEFAULT_CHAT_MODEL = "meta/llama-3.1-8b-instruct";

const MODEL_FALLBACKS: Record<string, string> = {
  "microsoft/phi-4-mini-instruct": DEFAULT_CHAT_MODEL,
};

export function resolveChatModel(model: string): string {
  const trimmed = model.trim();
  return MODEL_FALLBACKS[trimmed] ?? trimmed;
}

export function getNvidiaProvider() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured");
  }

  return createOpenAICompatible({
    name: "nvidia",
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey,
  });
}
