import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getCourseById } from "@/lib/services/courses.service";
import { listContentByCourse, getNextContentSortOrder } from "@/lib/services/content.service";
import { localizedCourseTitle } from "@/lib/i18n/localized-content";
import { getTranslations } from "next-intl/server";
import { CourseContentTable } from "@/components/admin/content/course-content-table";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function AdminCourseContentPage({ params }: Props) {
  const { courseId } = await params;
  const [, t] = await Promise.all([
    requireRole("admin"),
    getTranslations("app.admin.content"),
  ]);

  const [course, items, nextSortOrder] = await Promise.all([
    getCourseById(courseId),
    listContentByCourse(courseId),
    getNextContentSortOrder(courseId),
  ]);

  if (!course) notFound();

  return (
    <div className="space-y-6">
      <div>
<h1 className="text-2xl font-bold">
          {t("pageTitle", { course: localizedCourseTitle(course) })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <CourseContentTable courseId={courseId} items={items} nextSortOrder={nextSortOrder} />
    </div>
  );
}
