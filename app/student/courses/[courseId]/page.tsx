import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseGroupRoster } from "@/components/student/course-group-roster";
import { CourseContentList } from "@/components/student/course-content-list";
import { CourseProgressSummary } from "@/components/student/course-progress-summary";
import { requireRole } from "@/lib/auth/guards";
import { getCourseById } from "@/lib/services/courses.service";
import { listContentForStudentCourse } from "@/lib/services/content.service";
import {
  getStudentEnrollmentForCourse,
  getStudentCourseIds,
} from "@/lib/services/enrollments.service";
import { getGroupRoster } from "@/lib/services/groups.service";
import {
  getEnrollmentId,
  listViewedContentIds,
} from "@/lib/services/progress.service";
import { getStudentCourseProgress } from "@/lib/services/student-course-progress.service";
import { resolveContentDownloadUrls } from "@/lib/services/storage.service";
import {
  localizedCourseDescription,
  localizedCourseTitle,
} from "@/lib/i18n/localized-content";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function StudentCoursePage({ params }: Props) {
  const { courseId } = await params;
  const profile = await requireRole("student");

  const [course, enrolledIds, enrollmentInfo] = await Promise.all([
    getCourseById(courseId),
    getStudentCourseIds(profile.id),
    getStudentEnrollmentForCourse(profile.id, courseId),
  ]);

  if (!course || !enrolledIds.includes(courseId) || !enrollmentInfo) notFound();

  const roster = enrollmentInfo.group
    ? await getGroupRoster(enrollmentInfo.group.id)
    : null;

  const [items, t, enrollmentId, progress] = await Promise.all([
    course.published
      ? resolveContentDownloadUrls(
          await listContentForStudentCourse(profile.id, courseId),
        )
      : Promise.resolve([]),
    getTranslations("app.student.course"),
    course.published
      ? getEnrollmentId(profile.id, courseId)
      : Promise.resolve(null),
    course.published
      ? getStudentCourseProgress(profile.id, courseId)
      : Promise.resolve(null),
  ]);

  const viewedContentIds = enrollmentId
    ? Array.from(await listViewedContentIds(enrollmentId))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">{localizedCourseTitle(course)}</h1>
      <p className="mt-2 text-muted-foreground">
        {localizedCourseDescription(course) ?? "—"}
      </p>

      {progress ? (
        <CourseProgressSummary courseId={courseId} progress={progress} />
      ) : null}

      {roster ? <CourseGroupRoster roster={roster} className="mt-6" /> : null}

      {!course.published ? (
        <p className="mt-6 text-sm text-muted-foreground">{t("unpublished")}</p>
      ) : null}

      <h2 className="mt-8 text-lg font-semibold">{t("content")}</h2>
      <CourseContentList
        courseId={courseId}
        items={items}
        viewedContentIds={viewedContentIds}
      />
    </div>
  );
}
