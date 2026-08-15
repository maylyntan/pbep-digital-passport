import Link from "next/link";
import type { ReactNode } from "react";

interface BrandHeaderProps {
  /** Sub-line under the wordmark. */
  subtitle?: string;
  /** Title shown beside the K mark. */
  title?: string;
  /** Right-hand actions (links, buttons). */
  actions?: ReactNode;
  /** Use the white-on-navy treatment for headers sitting inside the hero. */
  onNavy?: boolean;
  href?: string;
}

export function BrandHeader({
  title = "Find Your Voice",
  subtitle = "English Festival Day",
  actions,
  onNavy = false,
  href = "/",
}: BrandHeaderProps) {
  return (
    <header className={`site-header${onNavy ? " site-header--on-navy" : ""} no-print`}>
      <Link href={href} className="brand" aria-label={`${title} home`}>
        <span className="brand-mark" aria-hidden="true">
          K
        </span>
        <span className="brand-text">
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
      </Link>
      {actions ? <div className="kit-actions">{actions}</div> : null}
    </header>
  );
}
