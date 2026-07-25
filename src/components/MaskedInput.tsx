"use client";

import { useState } from "react";
import { maskPhoneInput, maskCpfCnpjInput, maskDateInput } from "@/lib/masks";
import { cn } from "@/lib/utils";

type MaskKind = "phone" | "cpfcnpj" | "date";

const maskFns: Record<MaskKind, (v: string) => string> = {
  phone: maskPhoneInput,
  cpfcnpj: maskCpfCnpjInput,
  date: maskDateInput,
};

export function MaskedInput({
  mask,
  defaultValue = "",
  className,
  ...props
}: {
  mask: MaskKind;
  defaultValue?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "defaultValue">) {
  const fn = maskFns[mask];
  const [value, setValue] = useState(() => fn(defaultValue));

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(fn(e.target.value))}
      inputMode="numeric"
      className={cn("input", className)}
    />
  );
}
