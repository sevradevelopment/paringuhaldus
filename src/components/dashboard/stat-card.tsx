import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--brand)]">
          <Icon className="size-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
      </CardContent>
    </Card>
  );
}
