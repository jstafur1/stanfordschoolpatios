"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type ExamTimerProps = {
  startedAt: string;
  timeLimitMinutes: number;
  onExpire: () => void;
};

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ExamTimer({
  startedAt,
  timeLimitMinutes,
  onExpire,
}: ExamTimerProps) {
  const t = useTranslations("app.student.exams");
  const expiresAt = new Date(startedAt).getTime() + timeLimitMinutes * 60_000;
  const expiredRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, expiresAt - Date.now()),
  );

  useEffect(() => {
    expiredRef.current = false;
    const tick = () => {
      const next = Math.max(0, expiresAt - Date.now());
      setRemainingMs(next);
      if (next === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, onExpire]);

  const isLow = remainingMs > 0 && remainingMs <= 5 * 60_000;
  const isExpired = remainingMs === 0;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-medium",
        isExpired
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : isLow
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            : "border-border bg-muted text-foreground",
      )}
    >
      {isExpired
        ? t("timeUp")
        : t("timeRemaining", { time: formatRemaining(remainingMs) })}
    </div>
  );
}
