import { getLocale, getTranslations } from "next-intl/server";
import { getSession, getCurrentProfile } from "@/lib/auth/session";
import { ProfileSettings } from "./profile-settings";

export async function ProfilePageContent() {
  const [user, profile, locale, t] = await Promise.all([
    getSession(),
    getCurrentProfile(),
    getLocale(),
    getTranslations("app.profile"),
  ]);

  if (!user || !profile) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-8">
        <ProfileSettings
          profile={profile}
          email={user.email ?? "—"}
          locale={locale}
        />
      </div>
    </div>
  );
}
