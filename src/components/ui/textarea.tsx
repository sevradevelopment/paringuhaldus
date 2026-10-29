import * as React from "react";
import { cn } from "@/lib/utils";

type TextAreaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const TextAreaField = React.forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(function TextAreaField({ label, error, className, id, ...props }, ref) {
  const inputId = id ?? props.name ?? "textarea";

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-[var(--ink)]"
      >
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "min-h-28 w-full rounded-lg border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] shadow-sm outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--ring)]/25",
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
});
