"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { CourseLevel } from "@/lib/courses/levels";
import { landingContentMt } from "@/lib/landing/section-styles";

export type CourseCarouselItem = {
  id: string;
  image: string;
  title: string;
  description: string;
  level: CourseLevel | null;
};

type CourseCarouselProps = {
  courses: CourseCarouselItem[];
  onSelect: (id: string) => void;
};

export function CourseCarousel({ courses, onSelect }: CourseCarouselProps) {
  const t = useTranslations("platform");
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const onCarouselSelect = useCallback((carouselApi: CarouselApi | undefined) => {
    if (!carouselApi) return;
    setCurrent(carouselApi.selectedScrollSnap());
    setSnapCount(carouselApi.scrollSnapList().length);
  }, []);

  useEffect(() => {
    if (!api) return;

    queueMicrotask(() => onCarouselSelect(api));
    api.on("reInit", onCarouselSelect);
    api.on("select", onCarouselSelect);

    return () => {
      api.off("reInit", onCarouselSelect);
      api.off("select", onCarouselSelect);
    };
  }, [api, onCarouselSelect]);

  if (courses.length === 0) return null;

  return (
    <div className={cn(landingContentMt, "relative")}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-muted/30 to-transparent sm:w-10 md:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-muted/30 to-transparent sm:w-10 md:hidden"
      />

      <Carousel
        setApi={setApi}
        opts={{ align: "start", dragFree: false, containScroll: "trimSnaps" }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 sm:-ml-4 md:-ml-5">
          {courses.map((course) => (
            <CarouselItem
              key={course.id}
              className="basis-[88%] pl-3 sm:basis-1/2 sm:pl-4 md:basis-1/3 md:pl-5 lg:basis-1/4"
            >
              <button
                type="button"
                className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-left shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                aria-label={t("viewCourse", { title: course.title })}
                onClick={() => onSelect(course.id)}
              >
                <div className="relative overflow-hidden">
                  <Image
                    src={course.image}
                    alt=""
                    width={600}
                    height={400}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 88vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {course.level ? (
                    <span className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                      {course.level}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground sm:text-lg">
                    {course.title}
                  </h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {course.description}
                  </p>
                </div>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>

        {courses.length > 1 ? (
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {snapCount > 1 ? (
              snapCount <= 8 ? (
                <div
                  className="flex flex-wrap justify-center gap-1.5 sm:justify-start"
                  role="tablist"
                  aria-label={t("carousel.dotsLabel")}
                >
                  {Array.from({ length: snapCount }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      role="tab"
                      aria-selected={index === current}
                      aria-label={t("carousel.goToSlide", { number: index + 1 })}
                      className={cn(
                        "size-2 rounded-full transition-all duration-200",
                        index === current
                          ? "w-6 bg-primary"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                      )}
                      onClick={() => api?.scrollTo(index)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm tabular-nums text-muted-foreground">
                  {t("carousel.position", {
                    current: current + 1,
                    total: snapCount,
                  })}
                </p>
              )
            ) : (
              <span className="hidden sm:block sm:flex-1" />
            )}

            <div className="flex items-center gap-2">
              <CarouselPrevious
                variant="outline"
                size="icon"
                className="static size-10 translate-y-0 rounded-full border-border/80 bg-background/80 shadow-sm backdrop-blur-sm"
                aria-label={t("carousel.previous")}
              />
              <CarouselNext
                variant="outline"
                size="icon"
                className="static size-10 translate-y-0 rounded-full border-border/80 bg-background/80 shadow-sm backdrop-blur-sm"
                aria-label={t("carousel.next")}
              />
            </div>
          </div>
        ) : null}
      </Carousel>
    </div>
  );
}
