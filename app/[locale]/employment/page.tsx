import { getTranslations, setRequestLocale } from "next-intl/server";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import { JobCard } from "@/components/landing/employment/job-card";
import {
  landingLabel,
  landingSection,
  landingTitle,
} from "@/lib/landing/section-styles";
import { listPublishedJobPostings } from "@/lib/services/jobs.service";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EmploymentPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [jobs, t] = await Promise.all([
    listPublishedJobPostings(),
    getTranslations("employment"),
  ]);

  return (
    <>
      <LandingHeader />
      <main className={landingSection}>
        <div className="mx-auto max-w-7xl">
          <p className={landingLabel}>{t("careersLabel")}</p>
          <h1 className={landingTitle}>{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
          {jobs.length === 0 ? (
            <p className="mt-10 rounded-3xl bg-accent-lavender/60 px-8 py-12 text-center text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
