"use client";

import { useState, useTransition } from "react";
import type { InquiryStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateInquiryStatusAction } from "@/lib/actions/inquiries";
import {
  inquiryStatusLabel,
  INQUIRY_STATUSES,
} from "@/lib/inquiries/labels";

export function InquiryStatusForm({
  inquiryId,
  status,
}: {
  inquiryId: string;
  status: InquiryStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await updateInquiryStatusAction({
            inquiryId,
            status: value,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-[var(--ink)]">Muuda staatust</span>
        <select
          className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--ring)]/25"
          value={value}
          onChange={(e) => setValue(e.target.value as InquiryStatus)}
        >
          {INQUIRY_STATUSES.map((item) => (
            <option key={item} value={item}>
              {inquiryStatusLabel[item]}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending || value === status}>
        {pending ? "Salvestan…" : "Uuenda staatust"}
      </Button>
    </form>
  );
}
