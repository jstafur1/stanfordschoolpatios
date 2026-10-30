import type { JobPosting } from "@/lib/supabase/mappers";

export function formatSalaryRange(job: JobPosting): string | null {
  if (!job.showSalary) return null;

  const currency = job.salaryCurrency ?? "EUR";
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  const min = job.salaryMin ? Number(job.salaryMin) : null;
  const max = job.salaryMax ? Number(job.salaryMax) : null;

  if (min != null && max != null) {
    return `${formatter.format(min)} – ${formatter.format(max)}`;
  }
  if (min != null) return formatter.format(min);
  if (max != null) return formatter.format(max);
  return null;
}
