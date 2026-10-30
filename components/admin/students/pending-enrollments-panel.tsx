"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  approveEnrollmentAction,
  rejectEnrollmentAction,
} from "@/app/actions/admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  localizedCourseTitle,
  localizedLanguageName,
} from "@/lib/i18n/localized-content";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import type { Course, Language, Profile } from "@/lib/supabase/mappers";

type PendingEnrollment = {
  enrollment: { id: string; enrolledAt: Date };
  course: Course | null;
  student: Profile | null;
  language: Language | null;
};

type Props = {
  items: PendingEnrollment[];
};

export function PendingEnrollmentsPanel({ items }: Props) {
  const t = useTranslations("app.admin.pendingEnrollments");
  const te = useTranslations("app.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleApprove(enrollmentId: string) {
    startTransition(async () => {
      const result = await approveEnrollmentAction(enrollmentId);
      if (!result.ok) {
        toast.error(translateActionError(result, te));
        return;
      }
      toast.success(t("approved"));
      router.refresh();
    });
  }

  function handleReject(enrollmentId: string) {
    startTransition(async () => {
      const result = await rejectEnrollmentAction(enrollmentId);
      if (!result.ok) {
        toast.error(translateActionError(result, te));
        return;
      }
      toast.success(t("rejected"));
      router.refresh();
    });
  }

  if (!items.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map(({ enrollment, course, student, language }) => (
        <li
          key={enrollment.id}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium text-foreground">
              {student?.fullName ?? t("unknownStudent")}
            </p>
            <p className="text-sm text-muted-foreground">
              {course ? localizedCourseTitle(course) : t("unknownCourse")}
              {language ? ` · ${localizedLanguageName(language)}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("requestedAt", {
                date: enrollment.enrolledAt.toLocaleDateString(),
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => handleApprove(enrollment.id)}
              className={cn(buttonVariants(), "rounded-full")}
            >
              {t("approve")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => handleReject(enrollment.id)}
              className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
            >
              {t("reject")}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
