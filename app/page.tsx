import { Suspense } from "react";

import { PassportView } from "@/components/PassportView";

export default function PassportPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-screen">
          <div className="spinner" aria-hidden="true" />
          <p>Opening your passport…</p>
        </div>
      }
    >
      <PassportView />
    </Suspense>
  );
}
