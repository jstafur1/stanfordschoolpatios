import type { CourseRole } from "@/lib/platform/course-nav";

export function getCourseNavLabels(
  role: CourseRole,
  tCourse: (key: string) => string,
  tPlatform: (key: string) => string,
) {
  const segmentLabels: Record<string, string> = {
    overview: tPlatform("overview"),
    content: tPlatform("content"),
    exams: tPlatform("exams"),
    grades: tPlatform("grades"),
    progress: tPlatform("progress"),
    groups: tPlatform("groups"),
    practice: tPlatform("practice"),
    chatbot: tPlatform("chatbot"),
  };

  const nestedLabels: Record<string, string> = {
    result: tPlatform("examResult"),
    attempt: tPlatform("attemptReview"),
  };

  const navLabels: Record<string, string> = {
    overview: tPlatform("overview"),
    content:
      role === "student"
        ? tCourse("content")
        : role === "admin"
          ? tPlatform("content")
          : tCourse("content"),
    exams:
      role === "student" ? tPlatform("exams") : tCourse("exams"),
    grades: role === "teacher" ? tCourse("grades") : tPlatform("grades"),
    progress: tPlatform("progress"),
    groups: tPlatform("groups"),
    practice: tPlatform("practice"),
    chatbot: role === "teacher" ? tCourse("practiceChat") : tPlatform("chatbot"),
  };

  return { segmentLabels, nestedLabels, navLabels };
}
