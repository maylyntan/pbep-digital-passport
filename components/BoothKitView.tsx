"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { BrandHeader } from "@/components/BrandHeader";
import { QrCard } from "@/components/QrCard";
import { SiteFooter } from "@/components/SiteFooter";
import { BOOTHS } from "@/lib/booths";

export function BoothKitView() {
  const [origin, setOrigin] = useState(process.env.NEXT_PUBLIC_SITE_URL ?? "");

  useEffect(() => {
    // Fall back to the current origin when the site URL is not configured.
    if (!process.env.NEXT_PUBLIC_SITE_URL) setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    document.title = "Booth QR Kit | Find Your Voice Festival";
  }, []);

  return (
    <div className="page booth-kit-page">
      <div className="shell">
        <BrandHeader
          href="/teacher"
          actions={
            <>
              <button
                type="button"
                className="header-link"
                onClick={() => window.print()}
              >
                <Printer size={16} aria-hidden="true" /> Print QR Kit
              </button>
              <Link href="/teacher" className="header-link">
                <ArrowLeft size={16} aria-hidden="true" /> Back to dashboard
              </Link>
            </>
          }
        />
      </div>

      <main className="page-body shell" style={{ paddingBottom: "60px" }}>
        <section className="kit-intro no-print">
          <span className="kicker">Facilitator resources</span>
          <h1>Booth QR Kit</h1>
          <p className="lead" style={{ maxWidth: "720px" }}>
            Print and place one card at each booth. Students complete the speaking
            activity, scan the booth&rsquo;s unique QR code, and collect their digital
            stamp once you confirm it.
          </p>
          <div className="kit-steps">
            <span>
              <strong>1</strong> Print
            </span>
            <span>
              <strong>2</strong> Display
            </span>
            <span>
              <strong>3</strong> Speak
            </span>
            <span>
              <strong>4</strong> Scan
            </span>
          </div>
          <p className="form-note" style={{ marginTop: "16px" }}>
            Codes point at <code>{origin || "this site"}</code>. Confirm the final domain
            before printing — the URL is baked into every code.
          </p>
        </section>

        <section className="qr-grid" aria-label="Printable booth QR codes">
          {BOOTHS.map((booth) => (
            <QrCard key={booth.id} booth={booth} origin={origin} />
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
