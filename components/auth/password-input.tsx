"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

export function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  autoFocus,
  showLabel,
  hideLabel
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
  showLabel: string;
  hideLabel: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-brand-primary">
        {label}
      </label>
      <div className="relative" dir="ltr">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 pe-12 outline-none transition focus:border-brand-accent"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? hideLabel : showLabel}
          className="absolute inset-y-0 end-0 flex w-12 items-center justify-center text-slate-500 hover:text-brand-primary dark:text-brand-mist"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
