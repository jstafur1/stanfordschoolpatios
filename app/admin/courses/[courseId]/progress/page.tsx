import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { listAuditEventsForCourse } from "@/lib/services/audit.service";
import { getCourseById } from "@/lib/services/courses.service";
import { listAttemptsForCourse } from "@/lib/services/grading.service";
import { listContentProgressForCourse } from "@/lib/services/progress.service";
import { CourseProgressPanel } from "@/components/platform/course-progress-panel";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function AdminCourseProgressPage({ params }: Props) {
  const { courseId } = await params;
  await requireRole("admin");

  const [course, progress, attempts, auditEvents] = await Promise.all([
    getCourseById(courseId),
    listContentProgressForCourse(courseId),
    listAttemptsForCourse(courseId),
    listAuditEventsForCourse(courseId),
  ]);

  if (!course) notFound();

  return (
    <CourseProgressPanel
      role="admin"
      courseId={courseId}
      progress={progress}
      auditEvents={auditEvents.map(({ event, actorName }) => ({
        eventType: event.eventType,
        actorName,
        createdAt: event.createdAt,
        metadata: event.metadata,
      }))}
      gradesHref={(attemptId) => `/admin/courses/${courseId}/grades/${attemptId}`}
      attempts={attempts.map(({ attempt, exam, studentName }) => ({
        attemptId: attempt.id,
        examTitle: exam.title,
        studentName,
        status: attempt.status,
        scorePercent: attempt.scorePercent,
      }))}
    />
  );
}
