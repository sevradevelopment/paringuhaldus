"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Copy, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  archiveQuoteAction,
  duplicateQuoteAction,
  generateQuotePdfAction,
  restoreQuoteAction,
  sendQuoteEmailAction,
} from "@/lib/actions/quotes";

export function QuoteActionButtons({
  quoteId,
  archived,
  defaultEmail,
  quoteNumber,
}: {
  quoteId: string;
  archived: boolean;
  defaultEmail?: string | null;
  quoteNumber: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [showEmail, setShowEmail] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await duplicateQuoteAction(quoteId);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              router.push(`/app/hinnapakkumised/${result.quoteId}`);
              router.refresh();
            });
          }}
        >
          <Copy className="size-4" />
          Kopeeri
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await generateQuotePdfAction(quoteId);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              if (!result.pdfBase64) return;
              const link = document.createElement("a");
              link.href = `data:application/pdf;base64,${result.pdfBase64}`;
              link.download = `${quoteNumber}.pdf`;
              link.click();
            });
          }}
        >
          <Download className="size-4" />
          PDF
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => setShowEmail((v) => !v)}
        >
          <Mail className="size-4" />
          Saada e-post
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = archived
                ? await restoreQuoteAction(quoteId)
                : await archiveQuoteAction(quoteId);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              router.push("/app/hinnapakkumised");
              router.refresh();
            });
          }}
        >
          {archived ? (
            <ArchiveRestore className="size-4" />
          ) : (
            <Archive className="size-4" />
          )}
          {archived ? "Taasta" : "Arhiveeri"}
        </Button>
      </div>

      {showEmail ? (
        <form
          className="space-y-2 rounded-xl border border-[var(--border)] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await sendQuoteEmailAction({
                quoteId,
                toEmail: email,
                subject: `Hinnapakkumine ${quoteNumber}`,
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setShowEmail(false);
              router.refresh();
            });
          }}
        >
          <label className="block text-sm">
            <span className="font-medium text-[var(--ink-muted)]">Saaja e-post</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm"
            />
          </label>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saadan…" : "Saada"}
          </Button>
        </form>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
