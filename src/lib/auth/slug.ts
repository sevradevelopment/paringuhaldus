export function slugifyCompanyName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base.length > 0 ? base : "ettevote";
}

export function uniqueOrgSlug(name: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slugifyCompanyName(name)}-${suffix}`;
}
