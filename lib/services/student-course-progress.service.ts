import "server-only";
import type { ExamOutcome } from "./completion.service";
import { listContentForStudentCourse } from "./content.service";
import { getStudentEnrollmentForCourse } from "./enrollments.service";
import { listExamsForStudentCourse } from "./attempts.service";
import {
  getEnrollmentId,
  listViewedContentIds,
} from "./progress.service";
import { resolveContentDownloadUrls } from "./storage.service";
import type { CompletionStatus } from "@/lib/i18n/completion-status";

export type StudentCourseProgress = {
  enrollment: {
    completionStatus: CompletionStatus;
    completedAt: Date | null;
    enrolledAt: Date;
  };
  materials: {
    totalCount: number;
    viewedCount: number;
    unviewedItems: Array<{ id: string; title: string }>;
    unavailableCount: number;
    allViewed: boolean;
  };
  exams: Array<{
    examId: string;
    title: string;
    passThresholdPercent: number | null;
    outcome: ExamOutcome;
    bestScore: number | null;
    inProgressAttemptId: string | null;
    latestReviewableAttemptId: string | null;
    attemptCount: number;
    maxAttempts: number;
  }>;
  whatsLeft: {
    unviewedMaterials: number;
    examsNotPassed: number;
  };
};

function contentCanOpen(item: {
  externalUrl: string | null;
  storagePath: string | null;
  downloadUrl?: string | null;
}) {
  return Boolean(item.externalUrl || item.storagePath || item.downloadUrl);
}

export async function getStudentCourseProgress(
  studentId: string,
  courseId: string,
): Promise<StudentCourseProgress | null> {
  const enrollmentInfo = await getStudentEnrollmentForCourse(studentId, courseId);
  if (!enrollmentInfo) return null;

  const { enrollment } = enrollmentInfo;
  const enrollmentId = await getEnrollmentId(studentId, courseId);

  const [contentItems, viewedIds, examSummaries] = await Promise.all([
    listContentForStudentCourse(studentId, courseId).then((items) =>
      resolveContentDownloadUrls(items),
    ),
    enrollmentId ? listViewedContentIds(enrollmentId) : Promise.resolve(new Set<string>()),
    listExamsForStudentCourse(studentId, courseId),
  ]);

  const unviewedItems = contentItems
    .filter((item) => !viewedIds.has(item.id))
    .map((item) => ({ id: item.id, title: item.title }));

  const unavailableCount = contentItems.filter(
    (item) => !contentCanOpen(item),
  ).length;

  const viewedCount = contentItems.length - unviewedItems.length;
  const allViewed =
    contentItems.length === 0 || unviewedItems.length === 0;

  const exams = examSummaries.map(
    ({
      exam,
      attemptCount,
      inProgressAttemptId,
      bestScore,
      latestReviewableAttemptId,
      outcome,
    }) => ({
      examId: exam.id,
      title: exam.title,
      passThresholdPercent: exam.passThresholdPercent,
      outcome,
      bestScore,
      inProgressAttemptId,
      latestReviewableAttemptId,
      attemptCount,
      maxAttempts: exam.maxAttempts,
    }),
  );

  const examsNotPassed = exams.filter(
    (exam) => exam.outcome !== "passed",
  ).length;

  return {
    enrollment: {
      completionStatus: enrollment.completionStatus,
      completedAt: enrollment.completedAt,
      enrolledAt: enrollment.enrolledAt,
    },
    materials: {
      totalCount: contentItems.length,
      viewedCount,
      unviewedItems,
      unavailableCount,
      allViewed,
    },
    exams,
    whatsLeft: {
      unviewedMaterials: unviewedItems.length,
      examsNotPassed,
    },
  };
}
