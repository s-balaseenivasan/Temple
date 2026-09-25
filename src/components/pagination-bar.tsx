import RowsPerPageSelect from "@/components/rows-per-page-select";
import Pagination from "@/components/pagination";

// The combined "belongs to the table" bar: count text + rows-per-page +
// page changer, all in one row (not wrapped in another card) directly under
// the table. Deliberately always renders the count/rows-per-page portion
// even with a single page, so page size stays changeable; the Previous/
// Numbers/Next control itself only appears once there's more than one page.
export default function PaginationBar({
  rangeStart,
  rangeEnd,
  totalCount,
  pageSize,
  page,
  totalPages,
  buildHref,
}: {
  rangeStart: number;
  rangeEnd: number;
  totalCount: number;
  pageSize: number;
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">
        {totalCount === 0
          ? "Showing 0 of 0 donations"
          : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} donation${totalCount === 1 ? "" : "s"}`}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <RowsPerPageSelect value={pageSize} />
        <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
      </div>
    </div>
  );
}
