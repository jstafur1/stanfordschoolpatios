import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { LandingHeader } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero";
import { PlatformSection } from "@/components/landing/platform-section";
import { TestimonialsSection } from "@/components/landing/testimonials";
import { StudentStoriesSection } from "@/components/landing/student-stories";
import { FaqSection } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/footer";
import { listPublishedCoursesForCatalog } from "@/lib/services/courses.service";
import {
  landingContentMt,
  landingSectionAlt,
} from "@/lib/landing/section-styles";

type Props = {
  params: Promise<{ locale: string }>;
};

async function CatalogPlatformSection() {
  const catalogCourses = await listPublishedCoursesForCatalog().catch(() => []);
  return <PlatformSection catalogCourses={catalogCourses} />;
}

function PlatformSectionFallback() {
  return (
    <section className={landingSectionAlt}>
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
        <div className="mt-3 h-8 w-72 max-w-full animate-pulse rounded bg-muted/50" />
        <div
          className={`${landingContentMt} h-64 animate-pulse rounded-3xl bg-muted/40`}
        />
      </div>
    </section>
  );
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <LandingHeader locale={locale} />
      <main className="bg-background">
        <HeroSection locale={locale} />
        <Suspense fallback={<PlatformSectionFallback />}>
          <CatalogPlatformSection />
        </Suspense>
        <TestimonialsSection />
        <StudentStoriesSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </>
  );
}
