import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatSalaryRange } from "@/lib/jobs/format";
import type { JobPosting } from "@/lib/supabase/mappers";

type JobCardProps = {
  job: JobPosting;
};

export async function JobCard({ job }: JobCardProps) {
  const [t, tc] = await Promise.all([
    getTranslations("employment"),
    getTranslations("app.common"),
  ]);

  const salary = formatSalaryRange(job);

  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {tc(
            `employmentType.${job.employmentType}` as "employmentType.full_time",
          )}
        </Badge>
        <Badge variant="outline">
          {tc(`workMode.${job.workMode}` as "workMode.on_site")}
        </Badge>
      </div>
      <h2 className="mt-4 text-xl font-bold text-foreground">{job.title}</h2>
      {job.location ? (
        <p className="mt-1 text-sm text-muted-foreground">{job.location}</p>
      ) : null}
      {salary ? (
        <p className="mt-2 text-sm font-medium text-foreground">{salary}</p>
      ) : null}
      <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">
        {job.description}
      </p>
      {job.applicationDeadline ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("deadline", {
            date: job.applicationDeadline.toLocaleDateString(),
          })}
        </p>
      ) : null}
      <Link
        href={`/employment/${job.id}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "mt-5 w-full rounded-full sm:w-auto",
        )}
      >
        {t("viewDetails")} →
      </Link>
    </article>
  );
}
