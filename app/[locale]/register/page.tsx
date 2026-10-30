import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";
import { LandingHeader } from "@/components/landing/header";
import { getCurrentProfile } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/roles";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("register");

  const profile = await getCurrentProfile();
  if (profile) {
    redirect(getDashboardPath(profile.role as "admin" | "student" | "teacher", locale));
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

          <RegisterForm locale={locale} />

          <p className="mt-6 text-center text-sm">
            <Link href={`/${locale}`} className="text-primary hover:underline">
              {t("back")}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
