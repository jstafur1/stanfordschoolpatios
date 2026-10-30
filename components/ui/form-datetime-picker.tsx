"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

function parseDateTimeValue(value: string): { date?: Date; time: string } {
  if (!value) return { time: "" };
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return { time: "" };
  return {
    date: parsed,
    time: format(parsed, "HH:mm"),
  };
}

type FormDateTimePickerProps = {
  name: string;
  defaultValue?: string;
  datePlaceholder?: string;
  className?: string;
  id?: string;
};

export function FormDateTimePicker({
  name,
  defaultValue = "",
  datePlaceholder,
  className,
  id,
}: FormDateTimePickerProps) {
  const initial = parseDateTimeValue(defaultValue);
  const [date, setDate] = useState<Date | undefined>(initial.date);
  const [time, setTime] = useState(initial.time);

  const submitValue =
    date && time
      ? `${format(date, "yyyy-MM-dd")}T${time}`
      : date
        ? `${format(date, "yyyy-MM-dd")}T00:00`
        : "";

  return (
    <div className={cn("grid gap-2 sm:grid-cols-[1fr_auto]", className)}>
      <input type="hidden" name={name} value={submitValue} />
      <DatePicker
        id={id}
        value={date}
        onChange={setDate}
        placeholder={datePlaceholder}
        className="w-full"
      />
      <TimePicker
        value={time}
        onChange={setTime}
        className="sm:w-40"
      />
    </div>
  );
}
