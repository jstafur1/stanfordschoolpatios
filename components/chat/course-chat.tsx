"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { clearChatHistoryAction } from "@/app/actions/chatbot";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type CourseChatProps = {
  courseId: string;
  initialMessages: UIMessage[];
  welcomeMessage?: string | null;
  initialInFlight?: boolean;
};

type ChatStatusResponse = {
  inFlight: boolean;
  requestId: string | null;
  expiresAt: string | null;
};

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

function createRequestId() {
  return crypto.randomUUID();
}

const pendingRequestIdByCourse = new Map<string, string | null>();

export function CourseChat({
  courseId,
  initialMessages,
  welcomeMessage,
  initialInFlight = false,
}: CourseChatProps) {
  const t = useTranslations("app.student.practice");
  const [clearOpen, setClearOpen] = useState(false);
  const [input, setInput] = useState("");
  const [serverInFlight, setServerInFlight] = useState(initialInFlight);

  const refreshChatStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/chat`, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        setServerInFlight(false);
        return;
      }
      const data = (await response.json()) as ChatStatusResponse;
      setServerInFlight(data.inFlight);
    } catch {
      setServerInFlight(false);
    }
  }, [courseId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/courses/${courseId}/chat`,
        prepareSendMessagesRequest: ({ messages, id }) => ({
          body: {
            messages,
            idempotencyKey: pendingRequestIdByCourse.get(courseId) ?? id,
          },
        }),
        fetch: async (input, init) => {
          const response = await globalThis.fetch(input, init);
          if (response.status === 409) {
            setServerInFlight(true);
          } else if (response.ok && init?.method === "POST") {
            setServerInFlight(true);
          }
          return response;
        },
      }),
    [courseId],
  );

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport,
    messages: initialMessages,
  });

  const isBusy = status === "submitted" || status === "streaming";
  const isBlocked = isBusy || serverInFlight;
  const emptyDescription = welcomeMessage?.trim() || t("emptyDescription");

  useEffect(() => {
    if (!serverInFlight) return;
    const interval = window.setInterval(() => {
      void refreshChatStatus();
    }, 2000);
    return () => window.clearInterval(interval);
  }, [refreshChatStatus, serverInFlight]);

  useEffect(() => {
    if (!isBusy) {
      queueMicrotask(() => {
        void refreshChatStatus();
      });
    }
  }, [isBusy, refreshChatStatus]);

  useEffect(() => {
    if (error && !isBusy) {
      queueMicrotask(() => {
        void refreshChatStatus();
      });
    }
  }, [error, isBusy, refreshChatStatus]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isBlocked) return;

    pendingRequestIdByCourse.set(courseId, createRequestId());
    void sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="flex h-[min(70vh,720px)] flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        {messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBlocked}
            onClick={() => setClearOpen(true)}
          >
            {t("clearHistory")}
          </Button>
        )}
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title={t("emptyTitle")}
              description={emptyDescription}
            />
          ) : (
            messages.map((message) => {
              const text = getMessageText(message);
              if (!text) return null;

              return (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.role === "assistant" ? (
                      <MessageResponse isAnimating={isBusy}>
                        {text}
                      </MessageResponse>
                    ) : (
                      <p className="whitespace-pre-wrap">{text}</p>
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}
          {isBlocked ? (
            <div className="flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              <span>{t("responding")}</span>
            </div>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error && (
        <p className="border-t border-border px-4 py-2 text-sm text-destructive">
          {error.message.includes("409") || serverInFlight
            ? t("responseInProgress")
            : error.message}
        </p>
      )}

      <form
        className="flex items-end gap-3 border-t border-border p-4"
        onSubmit={handleSubmit}
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("inputPlaceholder")}
          disabled={isBlocked}
          rows={2}
          className="min-h-0 resize-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button type="submit" disabled={isBlocked || !input.trim()} className="gap-2">
          {isBlocked ? (
            <>
              <Spinner className="size-4" />
              {t("sending")}
            </>
          ) : (
            t("send")
          )}
        </Button>
      </form>

      <ConfirmDeleteDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title={t("clearTitle")}
        description={t("clearDescription")}
        onConfirm={() => clearChatHistoryAction(courseId)}
        onDeleted={() => {
          setMessages([]);
          setServerInFlight(false);
          pendingRequestIdByCourse.delete(courseId);
          toast.success(t("cleared"));
        }}
      />
    </div>
  );
}
