"use client";

import { digitsOnly, formatGroupedDigits } from "@/lib/format";

type MoneyInputProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (digits: string) => void;
  required?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
};

/** Controlled money field: shows 1.500.000, submits digits via hidden name. */
export function MoneyInput({
  id,
  name,
  value,
  onChange,
  required,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: MoneyInputProps) {
  const digits = digitsOnly(value);

  return (
    <>
      {name ? <input type="hidden" name={name} value={digits} /> : null}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatGroupedDigits(digits)}
        onChange={(e) => onChange(digitsOnly(e.target.value))}
        required={required}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={className}
      />
    </>
  );
}
