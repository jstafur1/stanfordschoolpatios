import { requireRole } from "@/lib/auth/guards";
import { loadContentViewerPage } from "@/lib/content/content-viewer-page";
import { ContentViewer } from "@/components/content/content-viewer";
import { SetCourseBreadcrumb } from "@/components/platform/course-breadcrumb-context";

type Props = {
  params: Promise<{ courseId: string; contentId: string }>;
};

export default async function TeacherContentViewerPage({ params }: Props) {
  const { courseId, contentId } = await params;
  const profile = await requireRole("teacher");
  const { content, backHref } = await loadContentViewerPage(
    "teacher",
    profile.id,
    courseId,
    contentId,
  );

  return (
    <>
      <SetCourseBreadcrumb label={content.title} />
      <ContentViewer
        role="teacher"
        courseId={courseId}
        content={content}
        backHref={backHref}
      />
    </>
  );
}
