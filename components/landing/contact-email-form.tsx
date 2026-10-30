"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ContactEmailForm() {
  const t = useTranslations("contact");
  const tCommon = useTranslations("common");

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      onSubmit={(e) => e.preventDefault()}
    >
      <Input
        type="email"
        placeholder={t("placeholder")}
        className="h-12 flex-1 rounded-full border-input bg-background px-6 shadow-sm"
      />
      <button
        type="submit"
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-12 w-full shrink-0 rounded-full px-8 sm:w-auto",
        )}
      >
        {tCommon("send")}
      </button>
    </form>
  );
}
