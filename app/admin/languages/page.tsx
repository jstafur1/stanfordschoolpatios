import { getTranslations } from "next-intl/server";
import { listLanguages } from "@/lib/services/languages.service";
import { AdminLanguagesTable } from "@/components/admin/languages/admin-languages-table";

export default async function AdminLanguagesPage() {
  const [languages, t] = await Promise.all([
    listLanguages(),
    getTranslations("app.admin.languages"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AdminLanguagesTable languages={languages} />
    </div>
  );
}
