"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  compact?: boolean;
  className?: string;
};

type ThemeOption = "light" | "dark" | "system";

const options: ThemeOption[] = ["light", "dark", "system"];

function ThemeIcon({ theme }: { theme: ThemeOption }) {
  if (theme === "dark") return <Moon />;
  if (theme === "light") return <Sun />;
  return <Monitor />;
}

const labelKeys = {
  light: "themeLight",
  dark: "themeDark",
  auto: "themeAuto",
} as const;

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const t = useTranslations("common");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const activeTheme = (theme ?? "system") as ThemeOption;
  const triggerIcon =
    activeTheme === "system"
      ? resolvedTheme === "dark"
        ? "dark"
        : "light"
      : activeTheme;

  const labelKey =
    activeTheme === "light"
      ? labelKeys.light
      : activeTheme === "dark"
        ? labelKeys.dark
        : labelKeys.auto;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: compact ? "sm" : "default" }),
          "rounded-full",
          compact ? "size-10 shrink-0 p-0" : "gap-2",
          className,
        )}
        aria-label={t("themeToggleLabel")}
      >
        {mounted ? <ThemeIcon theme={triggerIcon} /> : <Monitor />}
        {!compact && mounted ? <span>{t(labelKey)}</span> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => setTheme(option)}
            className={cn(activeTheme === option && "bg-accent font-medium")}
          >
            <ThemeIcon theme={option} />
            {t(option === "system" ? labelKeys.auto : labelKeys[option])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
