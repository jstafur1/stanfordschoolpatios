import type { Metadata } from "next";
import {
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import { GoogleMapEmbed } from "@/components/landing/google-map-embed";
import {
  landingLabel,
  landingSection,
  landingTitle,
} from "@/lib/landing/section-styles";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");

  return (
    <>
      <LandingHeader locale={locale} />
      <main className={`bg-background ${landingSection}`}>
        <div className="mx-auto max-w-7xl">
          <p className={landingLabel}>{t("label")}</p>
          <h1 className={landingTitle}>{t("title")}</h1>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              {t("context.title")}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>{t("context.p1")}</p>
              <p>{t("context.p2")}</p>
              <p>{t("context.p3")}</p>
              <p>{t("context.p4")}</p>
            </div>
          </section>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-foreground">
                {t("vision.title")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("vision.content")}
              </p>
            </article>
            <article className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-foreground">
                {t("mission.title")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("mission.content")}
              </p>
            </article>
          </div>

          <p className="mt-10 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("legal")}
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                {t("institution.title")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("institution.content")}
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                {t("whatIsStanford.title")}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                <p>{t("whatIsStanford.p1")}</p>
                <p>{t("whatIsStanford.p2")}</p>
              </div>
            </section>
          </div>

          <div className="mt-12">
            <GoogleMapEmbed title={t("mapTitle")} />
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
