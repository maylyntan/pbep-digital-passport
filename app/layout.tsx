import type { Metadata, Viewport } from "next";

import { ToastProvider } from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Voice Passport | Find Your Voice Festival",
  description:
    "Digital participation passport for the Kaplan Find Your Voice English Festival Day. Speak at every booth, collect a stamp and become a Voice Champion.",
  applicationName: "My Voice Passport",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "My Voice Passport | Find Your Voice Festival",
    description:
      "Speak, connect and collect a digital stamp at every booth. Every Voice Matters. Every Conversation Counts.",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0d2b45",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-SG">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
