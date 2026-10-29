"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/textarea";
import { addInquiryNoteAction } from "@/lib/actions/inquiries";

export function InquiryNoteForm({ inquiryId }: { inquiryId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await addInquiryNoteAction({ inquiryId, body });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setBody("");
          router.refresh();
        });
      }}
    >
      <TextAreaField
        label="Lisa märkus"
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Nt. Helistasin kliendile, ootan materjali…"
        error={error ?? undefined}
      />
      <Button type="submit" size="sm" disabled={pending || !body.trim()}>
        {pending ? "Lisan…" : "Lisa märkus"}
      </Button>
    </form>
  );
}
