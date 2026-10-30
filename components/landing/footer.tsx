import { getTranslations } from "next-intl/server";
import { GoogleMapEmbed } from "@/components/landing/google-map-embed";
import { InstitutionContactDetails } from "@/components/landing/institution-contact-details";
import { INSTITUTION } from "@/lib/landing/institution";

export async function LandingFooter() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {INSTITUTION.shortName}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {INSTITUTION.name}
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {t("contactHeading")}
            </h2>
            <InstitutionContactDetails variant="footer" />
          </div>

          <GoogleMapEmbed variant="compact" title={t("mapTitle")} />
        </div>

        <p className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:text-sm">
          {t("rights", { year })}
        </p>
      </div>
    </footer>
  );
}
