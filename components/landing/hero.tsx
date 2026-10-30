import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { heroImage } from "@/lib/landing/courses";
import { landingSection } from "@/lib/landing/section-styles";

type Props = {
  locale: string;
};

export async function HeroSection({ locale }: Props) {
  void locale;
  const t = await getTranslations("hero");
  const tCommon = await getTranslations("common");

  return (
    <section id="servicios" className={`bg-background ${landingSection}`}>
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="order-2 flex flex-col gap-4 text-center lg:order-1 lg:text-left">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="text-primary">{chunks}</span>
              ),
            })}
          </h1>
          <p className="mx-auto max-w-lg text-base text-muted-foreground sm:text-lg lg:mx-0">
            {t("subtitle")}
          </p>
          <div className="flex justify-center lg:justify-start">
            <Link
              href="/about"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full px-8 py-6 text-base",
              )}
            >
              {tCommon("learnMore")}
            </Link>
          </div>
        </div>

        <div className="relative order-1 mx-auto w-full max-w-sm sm:max-w-md lg:order-2 lg:max-w-none">
          <div
            className="absolute -right-2 top-6 h-[88%] w-[82%] rotate-3 rounded-3xl bg-accent-peach sm:-right-4 sm:top-8"
            aria-hidden
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl sm:aspect-[3/4] lg:aspect-[4/5]">
            <Image
              src={heroImage}
              alt={t("imageAlt")}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 90vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
