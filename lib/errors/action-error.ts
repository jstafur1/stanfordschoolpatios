import type { ActionErrorCode } from "./codes";

export class AppActionError extends Error {
  readonly code: ActionErrorCode;

  constructor(code: ActionErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

const MESSAGE_PATTERNS: Array<{ pattern: RegExp | string; code: ActionErrorCode }> =
  [
    { pattern: /^Title is required$/i, code: "titleRequired" },
    {
      pattern: /^Title is required in all languages$/i,
      code: "titleRequiredAllLanguages",
    },
    { pattern: /^Name is required$/i, code: "nameRequired" },
    {
      pattern: /^Email and password are required$/i,
      code: "emailPasswordRequired",
    },
    { pattern: /^Student id is required$/i, code: "studentIdRequired" },
    {
      pattern: /^Name, email, and password are required$/i,
      code: "teacherNameEmailPasswordRequired",
    },
    {
      pattern: /^All translations and code are required$/i,
      code: "translationsAndCodeRequired",
    },
    { pattern: /^Title and type are required$/i, code: "titleAndTypeRequired" },
    {
      pattern: /^Question text and type are required$/i,
      code: "questionTextAndTypeRequired",
    },
    { pattern: /^Password must be at least 8 characters$/i, code: "passwordMinLength" },
    { pattern: /^Password must be at least 6 characters$/i, code: "passwordMinLength" },
    { pattern: /^Passwords do not match$/i, code: "passwordsMismatch" },
    { pattern: /^Already enrolled in this course$/i, code: "alreadyEnrolled" },
    {
      pattern: /^Enrollment request already pending$/i,
      code: "enrollmentPending",
    },
    { pattern: /^Attempt not found$/i, code: "attemptNotFound" },
    { pattern: /^Not enrolled in this course$/i, code: "notEnrolled" },
    { pattern: /^Attempt is no longer in progress$/i, code: "attemptNotInProgress" },
    { pattern: /^Time limit exceeded$/i, code: "timeLimitExceeded" },
    { pattern: /^Maximum attempts reached$/i, code: "maxAttemptsReached" },
    { pattern: /^Attempt already submitted$/i, code: "attemptAlreadySubmitted" },
    {
      pattern: /^Please answer all questions before submitting/i,
      code: "unansweredQuestions",
    },
    { pattern: /^This course is not available yet$/i, code: "courseNotAvailable" },
    { pattern: /^Forbidden$/i, code: "forbidden" },
    {
      pattern: /^Not allowed to manage this course$/i,
      code: "notAllowedCourse",
    },
    {
      pattern: /^Choice questions need at least two options$/i,
      code: "choiceOptionsMinTwo",
    },
    { pattern: /^Exam not found$/i, code: "examNotFound" },
    { pattern: /^Question not found$/i, code: "questionNotFound" },
    { pattern: /^Answer not found$/i, code: "answerNotFound" },
    { pattern: /^File must be 50 MB or smaller$/i, code: "fileTooLarge" },
    { pattern: /^Avatar must be 2 MB or smaller$/i, code: "avatarTooLarge" },
    {
      pattern: /^Avatar must be JPG, PNG, WebP, or GIF$/i,
      code: "avatarInvalidType",
    },
    {
      pattern: /already been registered|already exists|duplicate key value/i,
      code: "emailAlreadyRegistered",
    },
    { pattern: /^Invalid group for course$/i, code: "groupInvalid" },
    { pattern: /^Group is not active$/i, code: "groupInactive" },
    { pattern: /^Group is full$/i, code: "groupFull" },
    { pattern: /^Group has active enrollments$/i, code: "groupHasEnrollments" },
    { pattern: /^Job not found$/i, code: "jobNotFound" },
    { pattern: /^Job is not accepting applications$/i, code: "jobClosed" },
    {
      pattern: /^Application deadline has passed$/i,
      code: "applicationDeadlinePassed",
    },
    { pattern: /^CV file type not allowed$/i, code: "cvInvalidType" },
    { pattern: /^CV must be 10 MB or smaller$/i, code: "cvTooLarge" },
    { pattern: /^Application not found$/i, code: "applicationNotFound" },
    { pattern: /^Invalid application$/i, code: "invalidApplication" },
    { pattern: /^Invalid submission$/i, code: "honeypotTriggered" },
  ];

export function mapErrorToCode(message: string): ActionErrorCode {
  for (const entry of MESSAGE_PATTERNS) {
    if (typeof entry.pattern === "string") {
      if (message === entry.pattern) return entry.code;
    } else if (entry.pattern.test(message)) {
      return entry.code;
    }
  }
  return "generic";
}

export function fail(code: ActionErrorCode): never {
  throw new AppActionError(code);
}
