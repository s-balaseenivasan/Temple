"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const OPTIONS = [10, 25, 50, 100];

// Changing page size must reset to page 1 (otherwise "page 3 of 10-per-page"
// could silently become an out-of-range or misleading page once the
// per-page count changes) — enforced here by simply never carrying the old
// `page` param forward.
export default function RowsPerPageSelect({ value }: { value: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", e.target.value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-text-secondary">
      Rows per page
      <select
        value={value}
        onChange={onChange}
        aria-label="Rows per page"
        className="admin-input h-9 min-h-9 w-auto px-2"
      >
        {OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
