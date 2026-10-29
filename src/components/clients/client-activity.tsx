import { formatEtDateTime } from "@/lib/clients/labels";

type ActivityItem = {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
  actor: { name: string | null; email: string | null } | null;
};

export function ClientActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        Tegevusi pole veel registreeritud.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((item) => {
        const actorName =
          item.actor?.name?.trim() || item.actor?.email || "Süsteem";
        return (
          <li key={item.id} className="relative pl-4">
            <span
              className="absolute top-1.5 left-0 size-2 rounded-full bg-[var(--brand)]"
              aria-hidden
            />
            <p className="text-sm font-medium text-[var(--ink)]">
              {item.message}
            </p>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              {formatEtDateTime(item.createdAt)} · {actorName}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
