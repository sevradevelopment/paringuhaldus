import type { Metadata } from "next";
import { Users } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Kliendid – Päringuhaldus.ee",
};

export default function KliendidPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Kliendid"
      description="Siia tuleb klientide register ja kontaktide haldus."
    />
  );
}
