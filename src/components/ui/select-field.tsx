import * as React from "react";
import { cn } from "@/lib/utils";

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
};

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { label, error, options, className, id, ...props },
    ref,
  ) {
    const inputId = id ?? props.name ?? "select";

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--ink)]"
        >
          {label}
        </label>
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3.5 text-sm text-[var(--ink)] shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--ring)]/25",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
