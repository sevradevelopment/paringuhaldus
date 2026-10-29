import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Hinnapakkumised – Päringuhaldus.ee",
};

export default function HinnapakkumisedPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Hinnapakkumised"
      description="Siia tulevad hinnapakkumised, nende staatused ja seotud päringud."
    />
  );
}
