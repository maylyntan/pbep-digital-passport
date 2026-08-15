"use client";

import { QRCodeSVG } from "qrcode.react";
import { Mic, QrCode } from "lucide-react";

import type { Booth } from "@/lib/booths";

interface QrCardProps {
  booth: Booth;
  /** Absolute origin the QR should point at. */
  origin: string;
}

export function QrCard({ booth, origin }: QrCardProps) {
  const value = origin ? `${origin}/?booth=${booth.id}` : `/?booth=${booth.id}`;

  return (
    <article className="qr-card">
      <div className="qr-card-top">
        <span>Booth {String(booth.number).padStart(2, "0")}</span>
        <Mic size={18} aria-hidden="true" />
      </div>

      <div className="qr-code-wrap">
        <QRCodeSVG
          value={value}
          size={148}
          level="M"
          bgColor="#ffffff"
          fgColor="#0d2b45"
          title={`${booth.name} check-in code`}
        />
      </div>

      <h2>{booth.name}</h2>
      <p className="qr-skill">{booth.skill}</p>
      <p className="qr-prompt">{booth.prompt}</p>

      <div className="scan-instruction">
        <QrCode size={16} aria-hidden="true" /> Scan after completing the activity
      </div>
    </article>
  );
}
