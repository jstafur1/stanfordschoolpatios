import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { canManageCourse } from "@/lib/permissions/courses";
import { listAuditEventsForCourse } from "@/lib/services/audit.service";
import { getCourseById } from "@/lib/services/courses.service";
import { listAttemptsForCourse } from "@/lib/services/grading.service";
import { listContentProgressForCourse } from "@/lib/services/progress.service";
import { CourseProgressPanel } from "@/components/platform/course-progress-panel";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function TeacherCourseProgressPage({ params }: Props) {
  const { courseId } = await params;
  const profile = await requireRole("teacher");

  const allowed = await canManageCourse(profile.id, profile.role, courseId);
  if (!allowed) notFound();

  const [course, progress, attempts, auditEvents] = await Promise.all([
    getCourseById(courseId),
    listContentProgressForCourse(courseId),
    listAttemptsForCourse(courseId),
    listAuditEventsForCourse(courseId),
  ]);

  if (!course) notFound();

  return (
    <CourseProgressPanel
      role="teacher"
      courseId={courseId}
      progress={progress}
      auditEvents={auditEvents.map(({ event, actorName }) => ({
        eventType: event.eventType,
        actorName,
        createdAt: event.createdAt,
        metadata: event.metadata,
      }))}
      gradesHref={(attemptId) => `/teacher/courses/${courseId}/grades/${attemptId}`}
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
