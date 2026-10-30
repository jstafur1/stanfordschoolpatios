import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { testimonialImage } from "@/lib/landing/courses";
import {
  landingContentMt,
  landingLabel,
  landingSectionAlt,
  landingTitle,
} from "@/lib/landing/section-styles";

export async function TestimonialsSection() {
  const t = await getTranslations("testimonials");

  return (
    <section id="opiniones" className={landingSectionAlt}>
      <div className="mx-auto max-w-7xl">
        <p className={landingLabel}>{t("label")}</p>
        <h2 className={landingTitle}>{t("title")}</h2>

        <div
          className={`${landingContentMt} grid items-center gap-6 lg:grid-cols-2 lg:gap-8`}
        >
          <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border bg-muted/40 lg:max-w-none">
            <div className="relative aspect-[4/3] w-full sm:aspect-[5/4]">
              <Image
                src={testimonialImage}
                alt={t("imageAlt")}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 text-center lg:text-left">
            <h3 className="text-xl font-bold text-foreground sm:text-2xl">
              {t("heading")}
            </h3>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            <blockquote className="text-base leading-relaxed text-foreground sm:text-lg">
              &ldquo;{t("quote")}&rdquo;
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
