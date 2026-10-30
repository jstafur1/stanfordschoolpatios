import { requireRole } from "@/lib/auth/guards";
import { loadContentViewerPage } from "@/lib/content/content-viewer-page";
import { ContentViewer } from "@/components/content/content-viewer";
import { SetCourseBreadcrumb } from "@/components/platform/course-breadcrumb-context";

type Props = {
  params: Promise<{ courseId: string; contentId: string }>;
};

export default async function AdminContentViewerPage({ params }: Props) {
  const { courseId, contentId } = await params;
  const profile = await requireRole("admin");
  const { content, backHref } = await loadContentViewerPage(
    "admin",
    profile.id,
    courseId,
    contentId,
  );

  return (
    <>
      <SetCourseBreadcrumb label={content.title} />
      <ContentViewer
        role="admin"
        courseId={courseId}
        content={content}
        backHref={backHref}
      />
    </>
  );
}
