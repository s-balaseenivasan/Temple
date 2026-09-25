import Link from "next/link";
import { SearchX } from "lucide-react";

export default function DonationEmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
        <SearchX className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium text-text-primary">No donations found</p>
        <p className="mt-1 text-sm text-text-secondary">
          {hasActiveFilters ? "Try changing your search or filter criteria." : "No donations have been recorded yet."}
        </p>
      </div>
      {hasActiveFilters && (
        <Link
          href="/admin/donations"
          className="btn btn-outline btn-sm mt-1"
        >
          Clear Filters
        </Link>
      )}
    </div>
  );
}
