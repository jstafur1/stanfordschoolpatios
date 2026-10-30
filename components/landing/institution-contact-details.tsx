import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  INSTITUTION,
  institutionMailtoHref,
  institutionTelHref,
} from "@/lib/landing/institution";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "full" | "footer";
  className?: string;
};

export async function InstitutionContactDetails({
  variant = "full",
  className,
}: Props) {
  const t = await getTranslations("contact");
  const isFooter = variant === "footer";

  const linkClass =
    "transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p
          className={cn(
            "font-semibold text-foreground",
            isFooter ? "text-sm" : "text-base sm:text-lg",
          )}
        >
          {isFooter ? INSTITUTION.shortName : INSTITUTION.name}
        </p>
      </div>

      <ul className="space-y-3">
        <li className="flex gap-3">
          <MapPin
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="text-sm text-muted-foreground">
            <p>{INSTITUTION.address}</p>
            <p>
              {t("fields.neighborhood")}: {INSTITUTION.neighborhood}
            </p>
            <p>
              {t("fields.municipality")}: {INSTITUTION.municipality}
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <Phone
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">
                {t("fields.phone")}:{" "}
              </span>
              <Link
                href={institutionTelHref(INSTITUTION.phone)}
                className={cn("text-foreground", linkClass)}
              >
                {INSTITUTION.phone}
              </Link>
            </p>
            <p>
              <span className="text-muted-foreground">
                {t("fields.mobile")}:{" "}
              </span>
              <Link
                href={institutionTelHref(INSTITUTION.mobile)}
                className={cn("text-foreground", linkClass)}
              >
                {INSTITUTION.mobile}
              </Link>
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <Mail
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <Link
            href={institutionMailtoHref(INSTITUTION.email)}
            className={cn("text-sm text-foreground", linkClass)}
          >
            {INSTITUTION.email}
          </Link>
        </li>
      </ul>

      {variant === "full" ? (
        <div className="space-y-1 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">
              {t("fields.chamberRegistration")}:
            </span>{" "}
            {INSTITUTION.chamberRegistration}
          </p>
          <p>
            <span className="font-medium text-foreground">
              {t("fields.nit")}:
            </span>{" "}
            {INSTITUTION.nit}
          </p>
          <p>
            <span className="font-medium text-foreground">
              {t("fields.enrollmentRenewal")}:
            </span>{" "}
            {INSTITUTION.enrollmentRenewal}
          </p>
          <p>
            <span className="font-medium text-foreground">
              {t("fields.director")}:
            </span>{" "}
            {INSTITUTION.director}
          </p>
        </div>
      ) : (
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            {t("fields.nit")}: {INSTITUTION.nit}
          </p>
          <p>
            {t("fields.chamberRegistration")}:{" "}
            {INSTITUTION.chamberRegistration}
          </p>
        </div>
      )}
    </div>
  );
}
