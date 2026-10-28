import Link from "next/link";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  href?: string;
};

export function SiteLogo({ className, href = "/" }: SiteLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-display text-lg font-extrabold tracking-tight text-[var(--ink)] sm:text-xl",
        className,
      )}
    >
      Päringuhaldus
      <span className="text-[var(--brand)]">.ee</span>
    </Link>
  );
}
