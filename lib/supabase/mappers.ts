import type { profiles } from "@/db/schema";
import type { languages } from "@/db/schema";
import type { courses } from "@/db/schema";
import { isCourseLevel } from "@/lib/courses/levels";
import type { teacherProfiles } from "@/db/schema";
import type { exams } from "@/db/schema";
import type { examAttempts } from "@/db/schema";
import type { examAnswers } from "@/db/schema";
import type { examQuestionOptions, examQuestions } from "@/db/schema";
import type { courseContent } from "@/db/schema/content";
import type { courseEnrollments } from "@/db/schema";
import type {
  courseChatMessages,
  courseChatbotConfigs,
} from "@/db/schema/chatbot";
import type { jobApplications, jobPostings } from "@/db/schema/jobs";

export type ProfileRow = Parameters<typeof mapProfile>[0];
export type LanguageRow = Parameters<typeof mapLanguage>[0];
export type CourseRow = Parameters<typeof mapCourse>[0];
export type TeacherProfileRow = Parameters<typeof mapTeacherProfile>[0];
export type ExamRow = Parameters<typeof mapExam>[0];
export type ExamAnswerRow = Parameters<typeof mapExamAnswer>[0];

export type Profile = typeof profiles.$inferSelect;
export type Language = typeof languages.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type ExamAttempt = typeof examAttempts.$inferSelect;
export type ExamAnswer = typeof examAnswers.$inferSelect;
export type ExamQuestion = typeof examQuestions.$inferSelect;
export type ExamQuestionOption = typeof examQuestionOptions.$inferSelect;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type CourseContent = typeof courseContent.$inferSelect;
export type CourseContentRow = Parameters<typeof mapCourseContent>[0];
export type ChatbotConfig = typeof courseChatbotConfigs.$inferSelect;
export type ChatMessage = typeof courseChatMessages.$inferSelect;
export type ChatbotConfigRow = Parameters<typeof mapChatbotConfig>[0];
export type ChatMessageRow = Parameters<typeof mapChatMessage>[0];
export type JobPosting = typeof jobPostings.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type JobPostingRow = Parameters<typeof mapJobPosting>[0];
export type JobApplicationRow = Parameters<typeof mapJobApplication>[0];

function toDate(value: string): Date {
  return new Date(value);
}

export function mapProfile(row: {
  id: string;
  role: string;
  requires_enrollment_approval?: boolean | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}): Profile {
  return {
    id: row.id,
    role: row.role as Profile["role"],
    requiresEnrollmentApproval: row.requires_enrollment_approval ?? true,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export function mapLanguage(row: {
  id: string;
  name: string;
  name_es?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  code: string;
  is_active: boolean;
  created_at: string;
}): Language {
  const fallback = row.name;
  return {
    id: row.id,
    name: row.name,
    nameEs: row.name_es ?? fallback,
    nameEn: row.name_en ?? fallback,
    nameFr: row.name_fr ?? fallback,
    code: row.code,
    isActive: row.is_active,
    createdAt: toDate(row.created_at),
  };
}

export function mapCourse(row: {
  id: string;
  title: string;
  title_es?: string | null;
  title_en?: string | null;
  title_fr?: string | null;
  description: string | null;
  description_es?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  category_id: string | null;
  language_id: string | null;
  level?: string | null;
  created_by: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}): Course {
  const titleFallback = row.title;
  const descriptionFallback = row.description;
  return {
    id: row.id,
    title: row.title,
    titleEs: row.title_es ?? titleFallback,
    titleEn: row.title_en ?? titleFallback,
    titleFr: row.title_fr ?? titleFallback,
    description: row.description,
    descriptionEs: row.description_es ?? descriptionFallback,
    descriptionEn: row.description_en ?? descriptionFallback,
    descriptionFr: row.description_fr ?? descriptionFallback,
    categoryId: row.category_id,
    languageId: row.language_id,
    level: isCourseLevel(row.level) ? row.level : null,
    createdBy: row.created_by,
    published: row.published,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export function mapTeacherProfile(row: {
  profile_id: string;
  language_id: string | null;
  bio: string | null;
  created_at: string;
}): TeacherProfile {
  return {
    profileId: row.profile_id,
    languageId: row.language_id,
    bio: row.bio,
    createdAt: toDate(row.created_at),
  };
}

export function mapExam(row: {
  id: string;
  course_id: string;
  title: string;
  time_limit_minutes: number | null;
  max_attempts: number;
  pass_threshold_percent: number | null;
  created_at: string;
}): Exam {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    timeLimitMinutes: row.time_limit_minutes,
    maxAttempts: row.max_attempts,
    passThresholdPercent: row.pass_threshold_percent,
    createdAt: toDate(row.created_at),
  };
}

export function mapExamAttempt(row: {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  started_at: string;
  submitted_at: string | null;
  score_percent: number | null;
}): ExamAttempt {
  return {
    id: row.id,
    examId: row.exam_id,
    studentId: row.student_id,
    status: row.status as ExamAttempt["status"],
    startedAt: toDate(row.started_at),
    submittedAt: row.submitted_at ? toDate(row.submitted_at) : null,
    scorePercent: row.score_percent,
  };
}

export function mapExamAnswer(row: {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_ids: string[] | null;
  open_text: string | null;
  is_correct: boolean | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}): ExamAnswer {
  return {
    id: row.id,
    attemptId: row.attempt_id,
    questionId: row.question_id,
    selectedOptionIds: row.selected_option_ids,
    openText: row.open_text,
    isCorrect: row.is_correct,
    reviewedAt: row.reviewed_at ? toDate(row.reviewed_at) : null,
    reviewedBy: row.reviewed_by,
  };
}

export function mapExamQuestion(row: {
  id: string;
  exam_id: string;
  question_type: string;
  text: string;
  sort_order: number;
  attachment_path: string | null;
}): ExamQuestion {
  return {
    id: row.id,
    examId: row.exam_id,
    questionType: row.question_type as ExamQuestion["questionType"],
    text: row.text,
    sortOrder: row.sort_order,
    attachmentPath: row.attachment_path,
  };
}

export type ExamQuestionOptionRow = Parameters<typeof mapExamQuestionOption>[0];

export function mapExamQuestionOption(row: {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  sort_order: number;
}): ExamQuestionOption {
  return {
    id: row.id,
    questionId: row.question_id,
    text: row.text,
    isCorrect: row.is_correct,
    sortOrder: row.sort_order,
  };
}

export function mapCourseContent(row: {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  content_type: string;
  storage_path: string | null;
  external_url: string | null;
  created_at: string;
}): CourseContent {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    sortOrder: row.sort_order,
    contentType: row.content_type as CourseContent["contentType"],
    storagePath: row.storage_path,
    externalUrl: row.external_url,
    createdAt: toDate(row.created_at),
  };
}

export function mapChatbotConfig(row: {
  course_id: string;
  enabled: boolean;
  system_instructions: string;
  welcome_message: string | null;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  updated_by: string | null;
  updated_at: string;
}): ChatbotConfig {
  return {
    courseId: row.course_id,
    enabled: row.enabled,
    systemInstructions: row.system_instructions,
    welcomeMessage: row.welcome_message,
    model: row.model,
    temperature: row.temperature,
    topP: row.top_p,
    maxTokens: row.max_tokens,
    updatedBy: row.updated_by,
    updatedAt: toDate(row.updated_at),
  };
}

export function mapChatMessage(row: {
  id: string;
  course_id: string;
  user_id: string;
  role: string;
  content: string;
  client_request_id?: string | null;
  created_at: string;
}): ChatMessage {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    role: row.role as ChatMessage["role"],
    content: row.content,
    clientRequestId: row.client_request_id ?? null,
    createdAt: toDate(row.created_at),
  };
}

export function mapCourseEnrollment(row: {
  id: string;
  course_id: string;
  student_id: string;
  group_id?: string | null;
  status: string;
  completion_status: string;
  enrolled_at: string;
  completed_at: string | null;
}): CourseEnrollment {
  return {
    id: row.id,
    courseId: row.course_id,
    studentId: row.student_id,
    groupId: row.group_id ?? null,
    status: row.status as CourseEnrollment["status"],
    completionStatus: row.completion_status as CourseEnrollment["completionStatus"],
    enrolledAt: toDate(row.enrolled_at),
    completedAt: row.completed_at ? toDate(row.completed_at) : null,
  };
}

export function mapCourseGroup(row: {
  id: string;
  course_id: string;
  name: string;
  sort_order: number;
  max_students: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    sortOrder: row.sort_order,
    maxStudents: row.max_students,
    isActive: row.is_active,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export type CourseGroup = ReturnType<typeof mapCourseGroup>;

export function mapAuditEvent(row: {
  id: string;
  event_type: string;
  actor_id: string | null;
  target_type: string;
  target_id: string | null;
  course_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}) {
  return {
    id: row.id,
    eventType: row.event_type,
    actorId: row.actor_id,
    targetType: row.target_type,
    targetId: row.target_id,
    courseId: row.course_id,
    metadata: row.metadata ?? {},
    createdAt: toDate(row.created_at),
  };
}

export function mapJobPosting(row: {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  employment_type: string;
  work_mode: string;
  location: string | null;
  salary_min: string | null;
  salary_max: string | null;
  salary_currency: string | null;
  show_salary: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  application_deadline: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}): JobPosting {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    requirements: row.requirements,
    benefits: row.benefits,
    employmentType: row.employment_type as JobPosting["employmentType"],
    workMode: row.work_mode as JobPosting["workMode"],
    location: row.location,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryCurrency: row.salary_currency,
    showSalary: row.show_salary,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    applicationDeadline: row.application_deadline
      ? toDate(row.application_deadline)
      : null,
    status: row.status as JobPosting["status"],
    createdBy: row.created_by,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export function mapJobApplication(row: {
  id: string;
  job_posting_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  years_of_experience: number | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  availability_start_date: string | null;
  cover_letter: string | null;
  cv_storage_path: string | null;
  cv_original_filename: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}): JobApplication {
  return {
    id: row.id,
    jobPostingId: row.job_posting_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    yearsOfExperience: row.years_of_experience,
    linkedinUrl: row.linkedin_url,
    portfolioUrl: row.portfolio_url,
    availabilityStartDate: row.availability_start_date,
    coverLetter: row.cover_letter,
    cvStoragePath: row.cv_storage_path,
    cvOriginalFilename: row.cv_original_filename,
    status: row.status as JobApplication["status"],
    adminNotes: row.admin_notes,
    createdAt: toDate(row.created_at),
  };
}
