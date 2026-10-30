import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { LandingHeader } from "@/components/landing/header";
import { getSession } from "@/lib/auth/session";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("resetPassword");

  const user = await getSession();
  if (!user) {
    redirect(`/${locale}/forgot-password`);
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
          <ResetPasswordForm locale={locale} />
          <p className="mt-6 text-center text-sm">
            <Link
              href={`/${locale}/login`}
              className="text-primary hover:underline"
            >
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
