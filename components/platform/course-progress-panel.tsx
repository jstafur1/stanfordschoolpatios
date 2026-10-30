import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { translateCompletionStatus, translateAttemptStatus } from "@/lib/i18n/completion-status";
import { translateEventType } from "@/lib/i18n/enum-labels";
import type { StudentContentProgress } from "@/lib/services/progress.service";

type Props = {
  role: "teacher" | "admin";
  courseId: string;
  progress: StudentContentProgress[];
  auditEvents?: Array<{
    eventType: string;
    actorName: string | null;
    createdAt: Date;
    metadata: Record<string, unknown>;
  }>;
  gradesHref: (attemptId: string) => string;
  attempts?: Array<{
    attemptId: string;
    examTitle: string;
    studentName: string;
    status: string;
    scorePercent: number | null;
  }>;
};

export async function CourseProgressPanel({
  role,
  progress,
  auditEvents = [],
  gradesHref,
  attempts = [],
}: Props) {
  const [t, tc] = await Promise.all([
    getTranslations("app.progress"),
    getTranslations("app.common"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <section className="mt-8">
        <h2 className="font-bold">{t("materialProgress")}</h2>
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {progress.map((row) => (
            <li key={row.enrollmentId} className="px-4 py-3">
              <p className="font-medium">{row.studentName ?? tc("dash")}</p>
              <p className="text-sm text-muted-foreground">
                {row.groupName ? `${t("group")}: ${row.groupName} · ` : ""}
                {t("materialsViewed", {
                  viewed: row.viewedCount,
                  total: row.totalCount,
                })}
                {" · "}
                {translateCompletionStatus(row.completionStatus, tc)}
              </p>
            </li>
          ))}
          {progress.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("noStudents")}
            </li>
          )}
        </ul>
      </section>

      {attempts.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-bold">{t("examHistory")}</h2>
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {attempts.map((row) => (
              <li key={row.attemptId} className="px-4 py-3">
                <Link href={gradesHref(row.attemptId)} className="block hover:opacity-80">
                  <p className="font-medium">{row.examTitle}</p>
                  <p className="text-sm text-muted-foreground">{row.studentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {translateAttemptStatus(row.status, tc)}
                    {row.scorePercent != null ? ` · ${row.scorePercent}%` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(role === "teacher" || role === "admin") && auditEvents.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-bold">{t("audit")}</h2>
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {auditEvents.map((event, index) => (
              <li key={`${event.eventType}-${index}`} className="px-4 py-3 text-sm">
                <p className="font-medium">{translateEventType(event.eventType, tc)}</p>
                <p className="text-muted-foreground">
                  {event.actorName ?? tc("dash")} ·{" "}
                  {event.createdAt.toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
