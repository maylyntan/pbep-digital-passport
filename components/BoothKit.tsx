"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { booths } from "@/lib/booths";

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, "");
}

export default function BoothKit() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const [origin, setOrigin] = useState(
    configuredSiteUrl ? normalizeOrigin(configuredSiteUrl) : "http://localhost:3000"
  );

  useEffect(() => {
    // Always prefer the explicitly configured public production URL.
    // Only fall back to the current browser origin for local development
    // or when NEXT_PUBLIC_SITE_URL has not been configured.
    if (!configuredSiteUrl) {
      setOrigin(normalizeOrigin(window.location.origin));
    }
  }, [configuredSiteUrl]);

  return (
    <main className="page-shell">
      <div className="section-head">
        <div>
          <span className="card-kicker">Teacher print kit</span>
          <h1>Booth QR Kit</h1>
          <p>
            Print these cards and place one at each booth. Students scan a QR code,
            complete the speaking challenge, then request teacher confirmation.
          </p>
        </div>
        <button className="secondary-btn print-hide" onClick={() => window.print()}>
          <Printer size={18} /> Print kit
        </button>
      </div>

      <section className="booth-grid">
        {booths.map((booth, index) => {
          const url = `${origin}/booth/${booth.slug}`;
          return (
            <article className="booth-card card" key={booth.slug}>
              <div className="booth-top">
                <div>
                  <span className="booth-number">Booth {index + 1}</span>
                  <h2>{booth.title}</h2>
                </div>
                <span className="booth-emoji">{booth.emoji}</span>
              </div>
              <p>{booth.prompt}</p>
              <div className="qr-wrap">
                <QRCodeSVG value={url} size={176} level="M" includeMargin />
              </div>
              <div className="url-chip">{url}</div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
