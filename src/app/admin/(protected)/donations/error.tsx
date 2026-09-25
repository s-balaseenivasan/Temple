"use client";

import { AlertTriangle } from "lucide-react";

// App Router error boundary for this route segment — shown automatically if
// the page's server-side data fetch throws, instead of leaving an admin
// staring at a blank/half-rendered table assuming there's simply no data.
export default function DonationsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-4 py-16 text-center">
      <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium text-text-primary">Unable to load donations</p>
        <p className="mt-1 text-sm text-text-secondary">Please try again.</p>
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="btn btn-primary btn-sm mt-1"
      >
        Retry
      </button>
    </div>
  );
}
