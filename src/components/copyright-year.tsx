import { cacheLife } from "next/cache";

/** Cached copyright year for static prerender (Next.js Cache Components). */
export async function CopyrightYear() {
  "use cache";
  cacheLife("max");
  return <>{new Date().getFullYear()}</>;
}
