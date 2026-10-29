"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MembershipRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  inviteTeamMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/actions/settings";

const roleLabel: Record<MembershipRole, string> = {
  OWNER: "Omanik",
  ADMIN: "Admin",
  MEMBER: "Töötaja",
};

type Member = {
  id: string;
  role: MembershipRole;
  user: { id: string; name: string | null; email: string };
};

type Invite = {
  id: string;
  email: string;
  role: MembershipRole;
  expiresAt: Date;
};

export function TeamPanel({
  members,
  invites,
  canManage,
  currentUserId,
  seatsUsed,
  maxUsers,
}: {
  members: Member[];
  invites: Invite[];
  canManage: boolean;
  currentUserId: string;
  seatsUsed: number;
  maxUsers: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <p className="text-sm text-[var(--ink-muted)]">
        Kasutus: {seatsUsed}
        {maxUsers !== null ? ` / ${maxUsers}` : " (piiramatu)"} kohta
      </p>

      {canManage ? (
        <form
          className="space-y-3 rounded-2xl border border-[var(--border)] p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setInviteUrl(null);
            startTransition(async () => {
              const result = await inviteTeamMemberAction({ email, role });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              if (result.inviteUrl) {
                setInviteUrl(result.inviteUrl);
              }
              setEmail("");
              router.refresh();
            });
          }}
        >
          <h3 className="text-sm font-semibold">Kutsu meeskonda</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@naide.ee"
              className="h-11 flex-1 rounded-lg border border-[var(--border)] px-3 text-sm"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
              className="h-11 rounded-lg border border-[var(--border)] px-3 text-sm"
            >
              <option value="MEMBER">Töötaja</option>
              <option value="ADMIN">Admin</option>
            </select>
            <Button type="submit" disabled={pending}>
              Kutsu
            </Button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {inviteUrl ? (
            <p className="break-all rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              E-post pole seadistatud. Kopeeri kutse link käsitsi: {inviteUrl}
            </p>
          ) : null}
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-muted)]/50 text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3">Liige</th>
              <th className="px-4 py-3">Roll</th>
              {canManage ? <th className="px-4 py-3">Tegevused</th> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-[var(--border)]/70">
                <td className="px-4 py-3">
                  <p className="font-medium">{member.user.name ?? "—"}</p>
                  <p className="text-[var(--ink-muted)]">{member.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  {canManage ? (
                    <select
                      className="h-9 rounded-lg border border-[var(--border)] px-2 text-sm"
                      value={member.role}
                      disabled={pending}
                      onChange={(e) => {
                        const next = e.target.value as MembershipRole;
                        startTransition(async () => {
                          const result = await updateMemberRoleAction({
                            membershipId: member.id,
                            role: next,
                          });
                          if (!result.ok) setError(result.error);
                          router.refresh();
                        });
                      }}
                    >
                      <option value="OWNER">Omanik</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Töötaja</option>
                    </select>
                  ) : (
                    roleLabel[member.role]
                  )}
                </td>
                {canManage ? (
                  <td className="px-4 py-3">
                    {member.user.id !== currentUserId ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await removeMemberAction({
                              membershipId: member.id,
                            });
                            if (!result.ok) setError(result.error);
                            router.refresh();
                          });
                        }}
                      >
                        Eemalda
                      </Button>
                    ) : (
                      <span className="text-xs text-[var(--ink-muted)]">Sina</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invites.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Ootel kutsed</h3>
          <ul className="space-y-2 text-sm">
            {invites.map((invite) => (
              <li key={invite.id} className="rounded-lg bg-[var(--surface-muted)]/60 px-3 py-2">
                {invite.email} · {roleLabel[invite.role]}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
