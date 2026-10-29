"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  archiveClientAction,
  restoreClientAction,
} from "@/lib/actions/clients";

export function ClientArchiveButton({
  clientId,
  archived,
}: {
  clientId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = archived
              ? await restoreClientAction(clientId)
              : await archiveClientAction(clientId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push("/app/kliendid");
            router.refresh();
          });
        }}
      >
        {archived ? (
          <ArchiveRestore className="size-4" aria-hidden />
        ) : (
          <Archive className="size-4" aria-hidden />
        )}
        {pending
          ? "Töötlen…"
          : archived
            ? "Taasta arhiivist"
            : "Arhiveeri"}
      </Button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
