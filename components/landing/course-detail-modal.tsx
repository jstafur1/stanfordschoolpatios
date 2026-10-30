"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CourseLevel } from "@/lib/courses/levels";
import type { CatalogCourse } from "@/lib/landing/catalog-filters";
import type { LandingCourse } from "@/lib/landing/courses";

export type SelectedCourse =
  | { type: "live"; course: CatalogCourse }
  | { type: "static"; course: LandingCourse };

type CourseDetailModalProps = {
  selected: SelectedCourse | null;
  onClose: () => void;
  title: string;
  description: string;
  level: CourseLevel | null;
  languageLabel: string | null;
  studentCount: number;
  teacherCount: number;
  materialCount: number;
};

export function CourseDetailModal({
  selected,
  onClose,
  title,
  description,
  level,
  languageLabel,
  studentCount,
  teacherCount,
  materialCount,
}: CourseDetailModalProps) {
  const t = useTranslations("platform");
  const image =
    selected?.type === "live"
      ? selected.course.image
      : selected?.type === "static"
        ? selected.course.image
        : null;

  return (
    <Dialog
      open={selected !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        {image ? (
          <div className="relative aspect-[3/2] w-full overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 512px"
            />
          </div>
        ) : null}
        <div className="space-y-4 p-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {languageLabel ? (
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                  {languageLabel}
                </span>
              ) : null}
              {level ? (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {level}
                </span>
              ) : null}
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>

          <dl className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="space-y-1 text-center">
              <dt className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3.5" aria-hidden />
                {t("modal.students")}
              </dt>
              <dd className="text-lg font-semibold text-foreground">{studentCount}</dd>
            </div>
            <div className="space-y-1 text-center">
              <dt className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <GraduationCap className="size-3.5" aria-hidden />
                {t("modal.teachers")}
              </dt>
              <dd className="text-lg font-semibold text-foreground">{teacherCount}</dd>
            </div>
            <div className="space-y-1 text-center">
              <dt className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <BookOpen className="size-3.5" aria-hidden />
                {t("modal.materials")}
              </dt>
              <dd className="text-lg font-semibold text-foreground">{materialCount}</dd>
            </div>
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
