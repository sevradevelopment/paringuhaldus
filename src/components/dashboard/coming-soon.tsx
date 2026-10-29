import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";

type ComingSoonProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function ComingSoon({ icon, title, description }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)] sm:text-base">
          {description}
        </p>
      </div>
      <EmptyState
        icon={icon}
        title="Peagi"
        description="See moodul on arenduses. Praegu näed vaid tühja olekut — andmeid siia veel ei kuvata."
      />
    </div>
  );
}
