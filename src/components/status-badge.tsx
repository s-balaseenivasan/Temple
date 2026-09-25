const TONE_CLASSES: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-gold-light/25 text-secondary",
  neutral: "bg-surface-muted text-text-secondary",
  error: "bg-error/10 text-error",
};

// Maps this app's actual enum values (ContentStatus/DonationStatus/etc.) to
// a visual tone — a lookup table, not a re-implementation of business
// status logic, which still lives entirely in the schema/API.
const STATUS_TONE: Record<string, keyof typeof TONE_CLASSES> = {
  published: "success",
  active: "success",
  success: "success",
  approved: "success",
  responded: "success",
  resolved: "success",
  completed: "success",
  draft: "warning",
  pending: "warning",
  new: "warning",
  in_progress: "warning",
  in_review: "warning",
  archived: "neutral",
  inactive: "neutral",
  closed: "neutral",
  rejected: "error",
  failed: "error",
  refunded: "error",
  cancelled: "error",
};

export default function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium capitalize leading-none ${TONE_CLASSES[tone]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
