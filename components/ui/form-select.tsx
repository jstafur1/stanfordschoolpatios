"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const FORM_SELECT_NONE = "__none__";

export type FormSelectOption = {
  value: string;
  label: string;
};

type FormSelectProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  options: FormSelectOption[];
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
};

export function FormSelect({
  name,
  defaultValue = "",
  placeholder = "Select…",
  options,
  allowEmpty = false,
  emptyLabel = "None",
  className,
}: FormSelectProps) {
  const normalizedDefault =
    defaultValue || (allowEmpty ? FORM_SELECT_NONE : options[0]?.value ?? "");
  const [value, setValue] = useState(normalizedDefault);

  const submitValue = value === FORM_SELECT_NONE ? "" : value;
  const selectedLabel =
    value === FORM_SELECT_NONE
      ? emptyLabel
      : options.find((option) => option.value === value)?.label;

  return (
    <>
      <input type="hidden" name={name} value={submitValue} />
      <Select
        value={value}
        onValueChange={(next) => setValue(next ?? FORM_SELECT_NONE)}
      >
        <SelectTrigger className={cn("w-full", className)}>
          <span className="truncate">
            {selectedLabel ?? placeholder}
          </span>
        </SelectTrigger>
        <SelectContent>
          {allowEmpty ? (
            <SelectItem value={FORM_SELECT_NONE}>{emptyLabel}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
