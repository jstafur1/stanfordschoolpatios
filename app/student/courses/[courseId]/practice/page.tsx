import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseChat } from "@/components/chat/course-chat";
import { requireRole } from "@/lib/auth/guards";
import {
  getChatbotConfig,
  hasChatInflightLock,
  listChatMessages,
  toUiMessages,
} from "@/lib/services/chatbot.service";
import { getCourseById } from "@/lib/services/courses.service";
import { getStudentCourseIds } from "@/lib/services/enrollments.service";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function StudentCoursePracticePage({ params }: Props) {
  const { courseId } = await params;
  const profile = await requireRole("student");

  const [course, enrolledIds, t] = await Promise.all([
    getCourseById(courseId),
    getStudentCourseIds(profile.id),
    getTranslations("app.student.practice"),
  ]);

  if (!course || !enrolledIds.includes(courseId) || !course.published) {
    notFound();
  }

  const config = await getChatbotConfig(courseId);
  if (!config.enabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("disabled")}</p>
        </div>
      </div>
    );
  }

  const [messages, initialInFlight] = await Promise.all([
    listChatMessages(courseId, profile.id),
    hasChatInflightLock(courseId, profile.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("pageSubtitle")}</p>
      </div>
      <CourseChat
        courseId={courseId}
        initialMessages={toUiMessages(messages)}
        welcomeMessage={config.welcomeMessage}
        initialInFlight={initialInFlight}
      />
    </div>
  );
}
