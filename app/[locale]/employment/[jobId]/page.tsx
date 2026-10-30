import { BackLink } from "@/components/ui/back-link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import { JobApplyPanel } from "@/components/landing/employment/job-apply-panel";
import { Badge } from "@/components/ui/badge";
import { landingSection, landingTitle } from "@/lib/landing/section-styles";
import { formatSalaryRange } from "@/lib/jobs/format";
import { getPublishedJobPosting } from "@/lib/services/jobs.service";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; jobId: string }>;
};

const sectionHeading =
  "text-sm font-semibold uppercase tracking-wide text-muted-foreground";

export default async function EmploymentDetailPage({ params }: Props) {
  const { locale, jobId } = await params;
  setRequestLocale(locale);

  const [job, t, tc] = await Promise.all([
    getPublishedJobPosting(jobId),
    getTranslations("employment"),
    getTranslations("app.common"),
  ]);

  if (!job) notFound();

  const salary = formatSalaryRange(job);

  const metadata = [
    job.location,
    salary,
    job.applicationDeadline
      ? t("deadline", {
          date: job.applicationDeadline.toLocaleDateString(),
        })
      : null,
  ].filter(Boolean);

  return (
    <>
      <LandingHeader />
      <main className={landingSection}>
        <div className="mx-auto max-w-7xl">
          <BackLink href="/employment">
            {t("backToList")}
          </BackLink>

          <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start lg:gap-12">
            <div className="min-w-0 pb-24 lg:pb-0">
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

              <h1 className={`${landingTitle} mt-4`}>{job.title}</h1>

              {metadata.length > 0 ? (
                <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                  {metadata.map((item, index) => (
                    <span key={index} className="inline-flex items-center gap-2">
                      {index > 0 ? (
                        <span aria-hidden className="text-border">
                          ·
                        </span>
                      ) : null}
                      {item}
                    </span>
                  ))}
                </p>
              ) : null}

              <section className="mt-10 space-y-8">
                <div>
                  <h2 className={sectionHeading}>{t("description")}</h2>
                  <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
                    {job.description}
                  </p>
                </div>

                {job.requirements ? (
                  <div>
                    <h2 className={sectionHeading}>{t("requirements")}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
                      {job.requirements}
                    </p>
                  </div>
                ) : null}

                {job.benefits ? (
                  <div>
                    <h2 className={sectionHeading}>{t("benefits")}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
                      {job.benefits}
                    </p>
                  </div>
                ) : null}

                {job.contactEmail || job.contactPhone ? (
                  <div className="rounded-3xl bg-accent-lavender/60 px-6 py-5">
                    <h2 className={sectionHeading}>{t("contact")}</h2>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {job.contactEmail ? <li>{job.contactEmail}</li> : null}
                      {job.contactPhone ? <li>{job.contactPhone}</li> : null}
                    </ul>
                  </div>
                ) : null}
              </section>
            </div>

            <JobApplyPanel jobId={job.id} jobTitle={job.title} />
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
