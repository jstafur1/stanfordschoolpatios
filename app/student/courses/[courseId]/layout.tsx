import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseShell } from "@/components/platform/course-shell";
import { requireRole } from "@/lib/auth/guards";
import { localizedCourseTitle } from "@/lib/i18n/localized-content";
import { getCourseNavLabels } from "@/lib/platform/course-layout-helpers";
import { getStudentCourseNav } from "@/lib/platform/course-nav";
import { getCourseById } from "@/lib/services/courses.service";
import {
  getStudentCourseIds,
  listCoursesForStudent,
} from "@/lib/services/enrollments.service";

type Props = {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
};

export default async function StudentCourseLayout({ children, params }: Props) {
  const { courseId } = await params;
  const profile = await requireRole("student");

  const [course, enrolledIds, enrollments, tCourse, tPlatform] =
    await Promise.all([
      getCourseById(courseId),
      getStudentCourseIds(profile.id),
      listCoursesForStudent(profile.id),
      getTranslations("app.student.course"),
      getTranslations("app.platform.courseNav"),
    ]);

  if (!course || !enrolledIds.includes(courseId)) notFound();

  const { segmentLabels, nestedLabels, navLabels } = getCourseNavLabels(
    "student",
    tCourse,
    tPlatform,
  );

  const navItems = getStudentCourseNav(courseId, navLabels);
  const courses = enrollments.map(({ course: enrolledCourse }) => ({
    id: enrolledCourse.id,
    title: localizedCourseTitle(enrolledCourse),
  }));

  return (
    <CourseShell
      role="student"
      courseId={courseId}
      courseTitle={localizedCourseTitle(course)}
      homeHref="/student"
      homeLabel={tCourse("back")}
      navItems={navItems}
      courses={courses}
      segmentLabels={segmentLabels}
      nestedLabels={nestedLabels}
    >
      {children}
    </CourseShell>
  );
}
