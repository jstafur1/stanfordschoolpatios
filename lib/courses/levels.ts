export const COURSE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CourseLevel = (typeof COURSE_LEVELS)[number];

export function isCourseLevel(value: string | null | undefined): value is CourseLevel {
  return COURSE_LEVELS.includes(value as CourseLevel);
}
