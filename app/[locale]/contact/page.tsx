import type { Metadata } from "next";
import {
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { ContactEmailForm } from "@/components/landing/contact-email-form";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import { GoogleMapEmbed } from "@/components/landing/google-map-embed";
import { InstitutionContactDetails } from "@/components/landing/institution-contact-details";
import {
  landingLabel,
  landingPanel,
  landingSection,
  landingTitle,
} from "@/lib/landing/section-styles";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tNav] = await Promise.all([
    getTranslations("contact"),
    getTranslations("nav"),
  ]);

  return (
    <>
      <LandingHeader locale={locale} />
      <main className={`bg-background ${landingSection}`}>
        <div className="mx-auto max-w-7xl">
          <p className={landingLabel}>{tNav("contact").toUpperCase()}</p>
          <h1 className={landingTitle}>{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div className={`${landingPanel} px-5 py-8 sm:px-8 sm:py-10`}>
              <InstitutionContactDetails variant="full" />
              <div className="mt-8 border-t border-border/40 pt-8">
                <ContactEmailForm />
              </div>
            </div>

            <GoogleMapEmbed title={t("mapTitle")} />
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
