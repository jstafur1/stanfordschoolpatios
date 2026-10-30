import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChatbotConfigForm } from "@/components/chat/chatbot-config-form";
import { requireRole } from "@/lib/auth/guards";
import { getChatbotConfig } from "@/lib/services/chatbot.service";
import { getCourseById } from "@/lib/services/courses.service";
import { localizedCourseTitle } from "@/lib/i18n/localized-content";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function AdminCourseChatbotPage({ params }: Props) {
  const { courseId } = await params;
  const [, t] = await Promise.all([
    requireRole("admin"),
    getTranslations("app.admin.chatbot"),
  ]);

  const [course, config] = await Promise.all([
    getCourseById(courseId),
    getChatbotConfig(courseId),
  ]);

  if (!course) notFound();

  return (
    <div className="space-y-6">
      <div>
<h1 className="text-2xl font-bold">
          {t("pageTitle", { course: localizedCourseTitle(course) })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ChatbotConfigForm courseId={courseId} config={config} scope="admin" />
    </div>
  );
}
