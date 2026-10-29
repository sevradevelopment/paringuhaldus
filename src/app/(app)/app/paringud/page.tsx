import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Päringud – Päringuhaldus.ee",
};

export default function ParingudPage() {
  return (
    <ComingSoon
      icon={Inbox}
      title="Päringud"
      description="Siia tuleb päringute nimekiri, filtrid ja staatuse haldus."
    />
  );
}
