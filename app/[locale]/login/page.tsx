import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeLink } from "@/components/landing/home-link";
import { LoginForm } from "@/components/auth/login-form";
import { LandingHeader } from "@/components/landing/header";
import { getCurrentProfile } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/roles";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ verified?: string; error?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { verified } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("login");

  const profile = await getCurrentProfile();
  if (profile) {
    redirect(
      getDashboardPath(profile.role as "admin" | "student" | "teacher", locale),
    );
  }

  return (
    <>
      <LandingHeader locale={locale} />
      <main className="flex flex-1 items-center justify-center bg-background px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt="Stanford English Academy"
              width={72}
              height={72}
              className="rounded-full"
            />
          </div>
          <h1 className="text-center text-2xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("subtitle")}
          </p>

          {verified === "1" ? (
            <p className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-center text-sm text-foreground">
              {t("verified")}
            </p>
          ) : null}

          <LoginForm locale={locale} />

          <p className="mt-6 text-center text-sm">
            <HomeLink className="text-primary hover:underline">
              {t("back")}
            </HomeLink>
          </p>
        </div>
      </main>
    </>
  );
}
