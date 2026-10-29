import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Seaded – Päringuhaldus.ee",
};

export default function SeadedPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Seaded"
      description="Siia tulevad organisatsiooni, meeskonna ja konto seaded."
    />
  );
}
