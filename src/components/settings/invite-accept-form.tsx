"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/auth/text-field";
import { acceptInviteAction } from "@/lib/actions/invites";

export function InviteAcceptForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await acceptInviteAction({ token, name, password });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push("/app");
          router.refresh();
        });
      }}
    >
      <p className="text-sm text-[var(--ink-muted)]">E-post: {email}</p>
      <TextField
        label="Nimi"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <TextField
        label="Parool"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Liitun…" : "Võta kutse vastu"}
      </Button>
    </form>
  );
}
