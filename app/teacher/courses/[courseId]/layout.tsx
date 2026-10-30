import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseShell } from "@/components/platform/course-shell";
import { requireRole } from "@/lib/auth/guards";
import { localizedCourseTitle } from "@/lib/i18n/localized-content";
import { canManageCourse } from "@/lib/permissions/courses";
import { getCourseNavLabels } from "@/lib/platform/course-layout-helpers";
import { getTeacherCourseNav } from "@/lib/platform/course-nav";
import {
  getCourseById,
  listCoursesForTeacher,
} from "@/lib/services/courses.service";

type Props = {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
};

export default async function TeacherCourseLayout({ children, params }: Props) {
  const { courseId } = await params;
  const profile = await requireRole("teacher");

  const [course, allowed, teacherCourses, tCourse, tPlatform, tGrades, tTeacher] =
    await Promise.all([
      getCourseById(courseId),
      canManageCourse(profile.id, profile.role, courseId),
      listCoursesForTeacher(profile.id),
      getTranslations("app.teacher.course"),
      getTranslations("app.platform.courseNav"),
      getTranslations("app.teacher.grades"),
      getTranslations("app.teacher"),
    ]);

  if (!course || !allowed) notFound();

  const { segmentLabels, nestedLabels, navLabels } = getCourseNavLabels(
    "teacher",
    tCourse,
    tPlatform,
  );
  nestedLabels.attempt = tGrades("attemptDetail");

  const navItems = getTeacherCourseNav(courseId, navLabels);
  const courses = teacherCourses.map(({ course: teacherCourse }) => ({
    id: teacherCourse.id,
    title: localizedCourseTitle(teacherCourse),
  }));

  return (
    <CourseShell
      role="teacher"
      courseId={courseId}
      courseTitle={localizedCourseTitle(course)}
      homeHref="/teacher"
      homeLabel={tTeacher("nav.courses")}
      navItems={navItems}
      courses={courses}
      segmentLabels={segmentLabels}
      nestedLabels={nestedLabels}
    >
      {children}
    </CourseShell>
  );
}
