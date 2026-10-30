"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

type FormDatePickerProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  id?: string;
};

export function FormDatePicker({
  name,
  defaultValue = "",
  placeholder,
  className,
  id,
}: FormDatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(
    parseDateValue(defaultValue),
  );

  const submitValue = date ? format(date, "yyyy-MM-dd") : "";

  return (
    <>
      <input type="hidden" name={name} value={submitValue} />
      <DatePicker
        id={id}
        value={date}
        onChange={setDate}
        placeholder={placeholder}
        className={cn("w-full", className)}
      />
    </>
  );
}
