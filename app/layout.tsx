import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, ShieldCheck } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Voice Passport",
  description: "A QR-powered English festival passport with teacher-confirmed booth stamps.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="nav-shell">
            <Link href="/" className="brand" aria-label="Voice Passport home">
              <span className="brand-mark">V</span>
              <span>
                <strong>Find Your Voice</strong>
                <small>English Festival Day</small>
              </span>
            </Link>
            <nav className="nav-links" aria-label="Main navigation">
              <Link href="/booth-kit"><QrCode size={18} /> Booth QR Kit</Link>
              <Link href="/teacher"><ShieldCheck size={18} /> Teacher</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <strong>Every Voice Matters.</strong> Every Conversation Counts.
        </footer>
      </body>
    </html>
  );
}
