import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseShell } from "@/components/platform/course-shell";
import { requireRole } from "@/lib/auth/guards";
import { localizedCourseTitle } from "@/lib/i18n/localized-content";
import { getCourseNavLabels } from "@/lib/platform/course-layout-helpers";
import { getAdminCourseNav } from "@/lib/platform/course-nav";
import {
  getCourseById,
  listCoursesForAdmin,
} from "@/lib/services/courses.service";

type Props = {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
};

export default async function AdminCourseLayout({ children, params }: Props) {
  const { courseId } = await params;
  await requireRole("admin");

  const [course, adminCourses, tCourses, tPlatform, tAdmin] = await Promise.all([
    getCourseById(courseId),
    listCoursesForAdmin(),
    getTranslations("app.admin.courses"),
    getTranslations("app.platform.courseNav"),
    getTranslations("app.admin"),
  ]);

  if (!course) notFound();

  const { segmentLabels, nestedLabels, navLabels } = getCourseNavLabels(
    "admin",
    tCourses,
    tPlatform,
  );
  navLabels.chatbot = tAdmin("chatbot.nav");

  const navItems = getAdminCourseNav(courseId, navLabels);
  const courses = adminCourses.map(({ course: adminCourse }) => ({
    id: adminCourse.id,
    title: localizedCourseTitle(adminCourse),
  }));

  return (
    <CourseShell
      role="admin"
      courseId={courseId}
      courseTitle={localizedCourseTitle(course)}
      homeHref="/admin/courses"
      homeLabel={tCourses("title")}
      navItems={navItems}
      courses={courses}
      segmentLabels={segmentLabels}
      nestedLabels={nestedLabels}
    >
      {children}
    </CourseShell>
  );
}
