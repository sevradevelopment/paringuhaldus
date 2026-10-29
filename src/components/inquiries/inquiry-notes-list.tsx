import { formatEtDateTime } from "@/lib/inquiries/labels";

type NoteItem = {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string | null; email: string | null } | null;
};

export function InquiryNotesList({ notes }: { notes: NoteItem[] }) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">Märkusi pole veel lisatud.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li
          key={note.id}
          className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm"
        >
          <p className="whitespace-pre-wrap text-sm text-[var(--ink)]">
            {note.body}
          </p>
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            {formatEtDateTime(note.createdAt)}
            {note.author
              ? ` · ${note.author.name?.trim() || note.author.email || "Kasutaja"}`
              : null}
          </p>
        </li>
      ))}
    </ul>
  );
}
