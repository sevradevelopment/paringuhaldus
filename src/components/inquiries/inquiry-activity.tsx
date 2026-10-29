import { formatEtDateTime } from "@/lib/inquiries/labels";

type ActivityItem = {
  id: string;
  message: string;
  createdAt: Date;
  actor: { name: string | null; email: string | null } | null;
};

export function InquiryActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        Tegevusajalugu on veel tühi.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 px-4 py-3"
        >
          <p className="text-sm font-medium text-[var(--ink)]">{item.message}</p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            {formatEtDateTime(item.createdAt)}
            {item.actor
              ? ` · ${item.actor.name?.trim() || item.actor.email || "Kasutaja"}`
              : null}
          </p>
        </li>
      ))}
    </ol>
  );
}
