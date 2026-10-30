import "server-only";
import { notFound } from "next/navigation";
import type { UserRole } from "@/lib/auth/roles";
import { assertCanViewContent } from "@/lib/content/content-access";
import { getCourseBasePath } from "@/lib/platform/course-nav";
import type { CourseRole } from "@/lib/platform/course-nav";
import {
  getEnrollmentId,
  listViewedContentIds,
} from "@/lib/services/progress.service";
import type { CourseContent } from "@/lib/supabase/mappers";

export async function loadContentViewerPage(
  role: CourseRole,
  userId: string,
  courseId: string,
  contentId: string,
): Promise<{
  content: CourseContent;
  backHref: string;
  viewed: boolean;
}> {
  let content: CourseContent;
  try {
    content = await assertCanViewContent(
      userId,
      role as UserRole,
      courseId,
      contentId,
    );
  } catch {
    notFound();
  }

  const backHref =
    role === "admin"
      ? `${getCourseBasePath(role, courseId)}/content`
      : getCourseBasePath(role, courseId);

  let viewed = false;
  if (role === "student") {
    const enrollmentId = await getEnrollmentId(userId, courseId);
    if (enrollmentId) {
      const viewedIds = await listViewedContentIds(enrollmentId);
      viewed = viewedIds.has(contentId);
    }
  }

  return { content, backHref, viewed };
}
