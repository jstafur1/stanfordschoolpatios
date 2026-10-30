"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

function parseTime(value: string): { hour: string; minute: string } {
  const [hour = "00", minute = "00"] = value.split(":");
  return { hour, minute };
}

type TimePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export function TimePicker({
  value = "",
  onChange,
  className,
  disabled,
}: TimePickerProps) {
  const parsed = useMemo(() => parseTime(value), [value]);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);

  function emit(nextHour: string, nextMinute: string) {
    setHour(nextHour);
    setMinute(nextMinute);
    onChange?.(`${nextHour}:${nextMinute}`);
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={hour}
        onValueChange={(next) => emit(next ?? hour, minute)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="flex items-center text-muted-foreground">:</span>
      <Select
        value={minute}
        onValueChange={(next) => emit(hour, next ?? minute)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type FormTimePickerProps = {
  name: string;
  defaultValue?: string;
  className?: string;
  id?: string;
};

export function FormTimePicker({
  name,
  defaultValue = "",
  className,
  id,
}: FormTimePickerProps) {
  const [time, setTime] = useState(defaultValue);

  return (
    <>
      <input type="hidden" name={name} value={time} id={id} />
      <TimePicker
        value={time}
        onChange={setTime}
        className={className}
      />
    </>
  );
}
