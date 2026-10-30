import { requireRole } from "@/lib/auth/guards";
import { loadContentViewerPage } from "@/lib/content/content-viewer-page";
import { ContentViewer } from "@/components/content/content-viewer";
import { ContentViewTracker } from "@/components/content/content-view-tracker";
import { SetCourseBreadcrumb } from "@/components/platform/course-breadcrumb-context";

type Props = {
  params: Promise<{ courseId: string; contentId: string }>;
};

export default async function StudentContentViewerPage({ params }: Props) {
  const { courseId, contentId } = await params;
  const profile = await requireRole("student");
  const { content, backHref, viewed } = await loadContentViewerPage(
    "student",
    profile.id,
    courseId,
    contentId,
  );

  return (
    <>
      <SetCourseBreadcrumb label={content.title} />
      {!viewed ? (
        <ContentViewTracker courseId={courseId} contentId={contentId} />
      ) : null}
      <ContentViewer
        role="student"
        courseId={courseId}
        content={content}
        backHref={backHref}
        viewed={viewed}
      />
    </>
  );
}
