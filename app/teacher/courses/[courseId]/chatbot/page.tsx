import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChatbotConfigForm } from "@/components/chat/chatbot-config-form";
import { requireRole } from "@/lib/auth/guards";
import { canManageCourse } from "@/lib/permissions/courses";
import { getChatbotConfig } from "@/lib/services/chatbot.service";
import { getCourseById } from "@/lib/services/courses.service";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function TeacherCourseChatbotPage({ params }: Props) {
  const { courseId } = await params;
  const [profile, t] = await Promise.all([
    requireRole("teacher"),
    getTranslations("app.teacher.chatbot"),
  ]);

  const allowed = await canManageCourse(profile.id, profile.role, courseId);
  if (!allowed) notFound();

  const [course, config] = await Promise.all([
    getCourseById(courseId),
    getChatbotConfig(courseId),
  ]);

  if (!course) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ChatbotConfigForm courseId={courseId} config={config} scope="teacher" />
    </div>
  );
}
