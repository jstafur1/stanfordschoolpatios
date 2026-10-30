type EnumTranslator = (key: string) => string;

function translateEnumSlug(
  namespace: string,
  slug: string,
  t: EnumTranslator,
): string {
  const key = `${namespace}.${slug}`;
  try {
    return t(key);
  } catch {
    return slug.replace(/_/g, " ");
  }
}

export function translateEventType(eventType: string, t: EnumTranslator): string {
  return translateEnumSlug("eventTypes", eventType, t);
}

export function translateQuestionType(type: string, t: EnumTranslator): string {
  return translateEnumSlug("questionTypes", type, t);
}

export function translateContentType(type: string, t: EnumTranslator): string {
  return translateEnumSlug("contentTypes", type, t);
}

export function translateEnrollmentStatus(status: string, t: EnumTranslator): string {
  return translateEnumSlug("enrollmentStatus", status, t);
}
