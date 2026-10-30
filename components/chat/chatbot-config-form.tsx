"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateChatbotConfigAction } from "@/app/actions/chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions/result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import type { ChatbotConfig } from "@/lib/supabase/mappers";

type ChatbotConfigFormProps = {
  courseId: string;
  config: ChatbotConfig;
  scope?: "admin" | "teacher";
};

const initialState: ActionResult | null = null;

export function ChatbotConfigForm({
  courseId,
  config,
  scope = "admin",
}: ChatbotConfigFormProps) {
  const t = useTranslations(
    scope === "teacher" ? "app.teacher.chatbot" : "app.admin.chatbot",
  );
  const [enabled, setEnabled] = useState(config.enabled);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [model, setModel] = useState(config.model);
  const [temperature, setTemperature] = useState(String(config.temperature));
  const [topP, setTopP] = useState(String(config.topP));
  const [maxTokens, setMaxTokens] = useState(String(config.maxTokens));
  const te = useTranslations("app.errors");
  const [state, formAction, pending] = useActionState(
    updateChatbotConfigAction,
    initialState,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(t("toastSaved"));
    } else {
      toast.error(translateActionError(state, te));
    }
  }, [state, t, te]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="model" value={model} />
      <input type="hidden" name="temperature" value={temperature} />
      <input type="hidden" name="topP" value={topP} />
      <input type="hidden" name="maxTokens" value={maxTokens} />

      <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-4">
        <div>
          <Label htmlFor="enabled">{t("enabled")}</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("enabledHelp")}
          </p>
        </div>
        <Switch
          id="enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        {enabled && <input type="hidden" name="enabled" value="on" />}
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemInstructions">{t("systemInstructions")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("systemInstructionsHelp")}
        </p>
        <Textarea
          id="systemInstructions"
          name="systemInstructions"
          defaultValue={config.systemInstructions}
          rows={8}
          placeholder={t("systemInstructionsPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="welcomeMessage">{t("welcomeMessage")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("welcomeMessageHelp")}
        </p>
        <Textarea
          id="welcomeMessage"
          name="welcomeMessage"
          defaultValue={config.welcomeMessage ?? ""}
          rows={3}
          placeholder={t("welcomeMessagePlaceholder")}
        />
      </div>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced((value) => !value)}
        >
          {t("advanced")}
        </Button>
        {showAdvanced && (
          <div className="space-y-4 rounded-2xl border border-border p-4">
            <div className="space-y-2">
              <Label htmlFor="model">{t("model")}</Label>
              <Input
                id="model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="temperature">{t("temperature")}</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={temperature}
                  onChange={(event) => setTemperature(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topP">{t("topP")}</Label>
                <Input
                  id="topP"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={topP}
                  onChange={(event) => setTopP(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTokens">{t("maxTokens")}</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="128"
                  max="4096"
                  value={maxTokens}
                  onChange={(event) => setMaxTokens(event.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
