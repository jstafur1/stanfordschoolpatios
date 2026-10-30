import {
  consumeStream,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { getCurrentProfile } from "@/lib/auth/session";
import { getNvidiaProvider, resolveChatModel } from "@/lib/ai/nvidia";
import {
  acquireChatInflightLock,
  appendChatMessage,
  assertStudentCanChat,
  getChatInflightLock,
  MAX_CHAT_MESSAGE_LENGTH,
  releaseChatInflightLock,
  resolveChatSystemPrompt,
} from "@/lib/services/chatbot.service";

export const maxDuration = 120;

const CHAT_STREAM_TIMEOUT_MS = 90_000;

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function conflictResponse(reason: "in_flight" | "same_request") {
  return Response.json(
    {
      code: reason,
      inFlight: true,
      message:
        reason === "same_request"
          ? "This message is already being processed."
          : "A response is already in progress for this chat.",
    },
    { status: 409 },
  );
}

function mergeAbortSignals(
  ...signals: Array<AbortSignal | undefined>
): AbortSignal {
  const active = signals.filter((signal): signal is AbortSignal => !!signal);
  if (active.length === 0) {
    return new AbortController().signal;
  }
  if (active.length === 1) {
    return active[0]!;
  }
  return AbortSignal.any(active);
}

export async function GET(_request: Request, context: RouteContext) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { courseId } = await context.params;

  try {
    await assertStudentCanChat(profile.id, profile.role, courseId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("not enabled") ? 404 : 403;
    return new Response(message, { status });
  }

  const lock = await getChatInflightLock(courseId, profile.id);

  return Response.json({
    inFlight: lock !== null,
    requestId: lock?.id ?? null,
    expiresAt: lock?.expiresAt.toISOString() ?? null,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { courseId } = await context.params;

  let config;
  try {
    config = await assertStudentCanChat(profile.id, profile.role, courseId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("not enabled") ? 404 : 403;
    return new Response(message, { status });
  }

  let body: { messages?: UIMessage[]; idempotencyKey?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const idempotencyKey = body.idempotencyKey?.trim();
  if (!idempotencyKey || !UUID_RE.test(idempotencyKey)) {
    return new Response("A valid idempotency key is required", { status: 400 });
  }

  const lockResult = await acquireChatInflightLock(
    courseId,
    profile.id,
    idempotencyKey,
  );
  if (!lockResult.ok) {
    return conflictResponse(lockResult.reason);
  }

  const messages = body.messages ?? [];
  if (messages.length === 0) {
    await releaseChatInflightLock(courseId, profile.id, idempotencyKey);
    return new Response("Messages are required", { status: 400 });
  }

  const lastMessage = messages.at(-1);
  const lastText =
    lastMessage?.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("")
      .trim() ?? "";

  if (lastMessage?.role !== "user" || !lastText) {
    await releaseChatInflightLock(courseId, profile.id, idempotencyKey);
    return new Response("Last message must be a user message", { status: 400 });
  }

  if (lastText.length > MAX_CHAT_MESSAGE_LENGTH) {
    await releaseChatInflightLock(courseId, profile.id, idempotencyKey);
    return new Response("Message is too long", { status: 400 });
  }

  try {
    await appendChatMessage(
      courseId,
      profile.id,
      "user",
      lastText,
      idempotencyKey,
    );
  } catch (error) {
    await releaseChatInflightLock(courseId, profile.id, idempotencyKey);
    const message =
      error instanceof Error ? error.message : "Failed to save message";
    return new Response(message, { status: 400 });
  }

  const [modelMessages, system] = await Promise.all([
    convertToModelMessages(messages),
    resolveChatSystemPrompt(courseId, config),
  ]);

  const nvidia = getNvidiaProvider();
  const modelId = resolveChatModel(config.model);
  const timeoutSignal = AbortSignal.timeout(CHAT_STREAM_TIMEOUT_MS);
  const abortSignal = mergeAbortSignals(request.signal, timeoutSignal);

  const releaseLock = async () => {
    try {
      await releaseChatInflightLock(courseId, profile.id, idempotencyKey);
    } catch {
      // Lock TTL will recover if release fails.
    }
  };

  try {
    const result = streamText({
      model: nvidia.chatModel(modelId),
      system,
      messages: modelMessages,
      temperature: config.temperature,
      topP: config.topP,
      maxOutputTokens: config.maxTokens,
      abortSignal,
    });

    return result.toUIMessageStreamResponse({
      consumeSseStream: consumeStream,
      onFinish: async ({ isAborted, responseMessage }) => {
        try {
          if (!isAborted) {
            const text = responseMessage.parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("")
              .trim();
            if (text) {
              await appendChatMessage(courseId, profile.id, "assistant", text);
            }
          }
        } finally {
          await releaseLock();
        }
      },
    });
  } catch (error) {
    await releaseLock();
    const message =
      error instanceof Error ? error.message : "Failed to generate response";
    const status =
      error instanceof Error && error.name === "TimeoutError" ? 504 : 500;
    return new Response(message, { status });
  }
}
