"use client";

import { cn } from "@/lib/utils";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextField({
  label,
  error,
  className,
  id,
  ...props
}: TextFieldProps) {
  const inputId = id ?? props.name ?? "field";

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-[var(--ink)]"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3.5 text-sm text-[var(--ink)] shadow-sm outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--ring)]/25",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
