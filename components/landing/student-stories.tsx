"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  studentStoryItems,
  type StudentReviewKey,
} from "@/lib/landing/courses";
import {
  landingContentMt,
  landingLabel,
  landingSectionAlt,
  landingTitle,
} from "@/lib/landing/section-styles";

export function StudentStoriesSection() {
  const t = useTranslations("stories");
  const [activeReview, setActiveReview] = useState<StudentReviewKey | null>(
    null,
  );
  const activeItem = studentStoryItems.find(
    (item) => item.reviewKey === activeReview,
  );

  return (
    <section className={landingSectionAlt}>
      <div className="mx-auto max-w-7xl">
        <p className={landingLabel}>{t("label")}</p>
        <h2 className={`${landingTitle} max-w-3xl`}>{t("title")}</h2>

        <Carousel
          opts={{ align: "start", loop: true }}
          className={`${landingContentMt} w-full`}
        >
          <CarouselContent className="-ml-3 sm:-ml-4">
            {studentStoryItems.map(({ image, reviewKey }, index) => (
              <CarouselItem
                key={image}
                className="basis-[78%] pl-3 sm:basis-1/2 sm:pl-4 md:basis-1/3 lg:basis-1/4"
              >
                <button
                  type="button"
                  className="relative block aspect-[2/3] min-h-[22rem] w-full overflow-hidden rounded-3xl text-left shadow-lg transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:min-h-[24rem]"
                  aria-label={t("viewStory", {
                    name: t(`reviews.${reviewKey}.name`),
                  })}
                  onClick={() => setActiveReview(reviewKey)}
                >
                  <Image
                    src={image}
                    alt={t("imageAlt", { number: index + 1 })}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-xs leading-snug text-white/90 sm:text-sm">
                        &ldquo;{t(`reviews.${reviewKey}.quote`)}&rdquo;
                      </span>
                      <span className="mt-2 block truncate font-bold text-white">
                        {t(`reviews.${reviewKey}.name`)}
                      </span>
                      <span className="block truncate text-sm text-white/80">
                        {t(`reviews.${reviewKey}.location`)}
                      </span>
                    </div>
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/60 bg-black/30 text-white backdrop-blur-sm"
                    >
                      <Play className="size-4" fill="currentColor" />
                    </span>
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-4 flex justify-center gap-2 sm:justify-end">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </div>

      <Dialog
        open={activeReview !== null}
        onOpenChange={(open) => {
          if (!open) setActiveReview(null);
        }}
      >
        {activeItem && activeReview && (
          <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
            <div className="relative aspect-[3/4] min-h-[28rem] w-full sm:min-h-[32rem]">
              <Image
                src={activeItem.image}
                alt={t(`reviews.${activeReview}.name`)}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 100vw, 448px"
              />
            </div>
            <div className="space-y-3 p-5">
              <DialogHeader className="gap-1">
                <DialogTitle>{t(`reviews.${activeReview}.name`)}</DialogTitle>
                <DialogDescription>
                  {t(`reviews.${activeReview}.location`)}
                </DialogDescription>
              </DialogHeader>
              <blockquote className="text-sm leading-relaxed text-foreground sm:text-base">
                &ldquo;{t(`reviews.${activeReview}.quote`)}&rdquo;
              </blockquote>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
