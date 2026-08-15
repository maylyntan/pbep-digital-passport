import Link from "next/link";

import { BrandHeader } from "@/components/BrandHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="page">
      <div className="hero">
        <div className="shell">
          <BrandHeader onNavy />
          <div className="hero-grid">
            <div>
              <span className="hero-eyebrow">Page not found</span>
              <h1>404</h1>
              <p className="hero-copy">
                That page isn&rsquo;t part of the festival. Scan a booth QR code again,
                or head back to your passport.
              </p>
            </div>
          </div>
        </div>
      </div>
      <main className="page-body shell main-lift">
        <div className="panel">
          <Link href="/" className="cta">
            Return to my passport
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
