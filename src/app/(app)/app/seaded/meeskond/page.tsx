import type { Metadata } from "next";
import { TeamPanel } from "@/components/settings/team-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import {
  getPendingInvites,
  getPlanUsage,
  getTeamMembers,
} from "@/lib/settings/queries";

export const metadata: Metadata = {
  title: "Meeskond – Seaded – Päringuhaldus.ee",
};

export const instant = false;

export default async function MeeskondSettingsPage() {
  const session = await requireOrgSession();
  const [members, invites, usage] = await Promise.all([
    getTeamMembers(session.organizationId),
    getPendingInvites(session.organizationId),
    getPlanUsage(session.organizationId),
  ]);

  const canManage = session.role === "OWNER" || session.role === "ADMIN";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-extrabold">Meeskond</CardTitle>
      </CardHeader>
      <CardContent>
        <TeamPanel
          members={members}
          invites={invites}
          canManage={canManage}
          currentUserId={session.userId}
          seatsUsed={usage.seatsUsed}
          maxUsers={usage.maxUsers}
        />
      </CardContent>
    </Card>
  );
}
