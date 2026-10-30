"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LOCALE_LABELS, type AppLocale } from "@/lib/i18n/localized-content";

const LOCALES: AppLocale[] = ["es", "en", "fr"];

type I18nTextFieldsProps = {
  fieldPrefix: string;
  label: string;
  values?: Partial<Record<AppLocale, string | null>>;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
};

export function I18nTextFields({
  fieldPrefix,
  label,
  values,
  multiline = false,
  required = false,
  placeholder,
}: I18nTextFieldsProps) {
  const Field = multiline ? Textarea : Input;

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid gap-3">
        {LOCALES.map((locale) => {
          const fieldName = `${fieldPrefix}${locale.charAt(0).toUpperCase()}${locale.slice(1)}`;
          const id = `${fieldPrefix}-${locale}`;
          return (
            <div key={locale} className="grid gap-1.5">
              <Label htmlFor={id} className="text-xs text-muted-foreground">
                {LOCALE_LABELS[locale]}
              </Label>
              <Field
                id={id}
                name={fieldName}
                required={required}
                defaultValue={values?.[locale] ?? ""}
                placeholder={placeholder}
                rows={multiline ? 3 : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
