import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowRight } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import AdminTableCard from "@/components/admin-table-card";
import StatusBadge from "@/components/status-badge";
import DonationSummary from "@/components/donation-summary";
import DonationEmptyState from "@/components/donation-empty-state";
import RecordDonationModal from "@/components/record-donation-modal";
import PaginationBar from "@/components/pagination-bar";
import { donationTypeLabel } from "@/lib/donation-type-label";

const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

interface Props {
  searchParams: Promise<{
    status?: string;
    purposeId?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
  }>;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// FEAT-047: admin search/filter/list. No member-wise or committee-linked
// filters exist by design (brief §1 — no donation attribution to members).
export default async function AdminDonationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const hasActiveFilters = Boolean(sp.status || sp.purposeId || sp.q || sp.from || sp.to);

  const where: Prisma.DonationWhereInput = {};
  if (sp.status) where.status = sp.status as Prisma.DonationWhereInput["status"];
  if (sp.purposeId) where.purposeId = sp.purposeId;
  if (sp.q) {
    where.OR = [
      { donorName: { contains: sp.q, mode: "insensitive" } },
      { mobile: { contains: sp.q } },
      { receipt: { receiptNumber: { contains: sp.q, mode: "insensitive" } } },
    ];
  }
  if (sp.from || sp.to) {
    where.createdAt = {
      ...(sp.from ? { gte: new Date(sp.from) } : {}),
      ...(sp.to ? { lte: new Date(`${sp.to}T23:59:59`) } : {}),
    };
  }

  const pageSize = ALLOWED_PAGE_SIZES.includes(Number(sp.limit)) ? Number(sp.limit) : DEFAULT_PAGE_SIZE;

  // totalCount is needed to clamp the requested page before we know how many
  // pages actually exist, so it's fetched first rather than alongside the
  // list query.
  const totalCount = await prisma.donation.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(1, Number(sp.page) || 1), totalPages);

  const [donations, purposes] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { purpose: true, receipt: true },
    }),
    prisma.donationPurpose.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  // Sequential, not Promise.all — piling more concurrent queries onto this
  // page's existing two-way Promise.all was found elsewhere in this admin
  // (audit-log page) to intermittently destabilize the local `prisma dev`
  // embedded Postgres connection handling. These summary figures are cheap,
  // low-traffic reads over data this page already has full access to (the
  // same schema/where-clause the table below uses), not a new API surface.
  const statusSums = await prisma.donation.groupBy({ by: ["status"], where, _sum: { amount: true } });
  const offlineInKindAgg = await prisma.donation.aggregate({
    where: { ...where, donationType: { not: "cash_online" } },
    _sum: { amount: true },
  });

  const sumFor = (status: string) => statusSums.find((s) => s.status === status)?._sum.amount?.toNumber() ?? 0;
  const totalAmount = statusSums.reduce((acc, s) => acc + (s._sum.amount?.toNumber() ?? 0), 0);
  const fmt = (n: number) => n.toLocaleString("en-IN");

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.status) params.set("status", sp.status);
    if (sp.purposeId) params.set("purposeId", sp.purposeId);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    if (pageSize !== DEFAULT_PAGE_SIZE) params.set("limit", String(pageSize));
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/admin/donations?${qs}` : "/admin/donations";
  };

  const inputClass =
    "admin-input h-11 placeholder:text-text-secondary/60";
  const labelClass = "mb-1.5 block text-xs font-medium text-text-secondary";

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="animate-admin-in mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-title text-[28px]">Donations</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage temple donations, receipts, payment records and donor contributions.</p>
        </div>
        <RecordDonationModal purposes={purposes.filter((p) => p.active).map((p) => ({ id: p.id, name_en: p.name_en }))} />
      </div>

      {/* SUMMARY */}
      <DonationSummary
        total={fmt(totalAmount)}
        successful={fmt(sumFor("success"))}
        pending={fmt(sumFor("pending"))}
        offlineInKind={fmt(offlineInKindAgg._sum.amount?.toNumber() ?? 0)}
      />

      {/* SEARCH & FILTERS */}
      <div className="admin-panel animate-admin-in mb-5 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-primary">
          <SlidersHorizontal className="h-4 w-4 text-secondary" aria-hidden="true" />
          Search &amp; Filters
        </h2>
        <form method="GET" className="space-y-4">
          {/* Preserves the chosen rows-per-page across a filter submission —
              filters themselves still always reset to page 1 (this field
              intentionally has no "page" counterpart), matching the brief's
              filter/pagination synchronization requirement. */}
          {pageSize !== DEFAULT_PAGE_SIZE && <input type="hidden" name="limit" value={pageSize} />}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))_repeat(2,minmax(0,0.8fr))]">
            <div>
              <label htmlFor="donations-filter-q" className={labelClass}>
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-text-secondary" aria-hidden="true" />
                <input
                  id="donations-filter-q"
                  name="q"
                  defaultValue={sp.q}
                  placeholder="Donor name, mobile or receipt number"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="donations-filter-status" className={labelClass}>
                Status
              </label>
              <select id="donations-filter-status" name="status" defaultValue={sp.status ?? ""} className={inputClass}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label htmlFor="donations-filter-purpose" className={labelClass}>
                Purpose
              </label>
              <select id="donations-filter-purpose" name="purposeId" defaultValue={sp.purposeId ?? ""} className={inputClass}>
                <option value="">All purposes</option>
                {purposes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="donations-filter-from" className={labelClass}>
                From
              </label>
              <input id="donations-filter-from" type="date" name="from" defaultValue={sp.from} className={inputClass} />
            </div>
            <div>
              <label htmlFor="donations-filter-to" className={labelClass}>
                To
              </label>
              <input id="donations-filter-to" type="date" name="to" defaultValue={sp.to} className={inputClass} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-border pt-4">
            <Link href="/admin/donations" className="text-sm font-medium text-text-secondary transition-colors hover:text-primary">
              Clear
            </Link>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* RESULTS COUNT */}
      <p className="mb-2 px-1 text-xs text-text-secondary">
        {totalCount === 0
          ? "Showing 0 of 0 donations"
          : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} donation${totalCount === 1 ? "" : "s"}`}
      </p>

      {/* TABLE (desktop/tablet) */}
      <AdminTableCard>
        <table className="hidden w-full border-collapse text-sm md:table">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Donor</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => {
              const donorLabel = d.anonymous ? "Anonymous" : d.donorName;
              return (
                <tr key={d.id} className="h-16 border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-light/25 text-xs font-semibold text-secondary"
                      >
                        {d.anonymous ? "—" : initialsOf(d.donorName)}
                      </span>
                      <span className="font-medium text-text-primary">{donorLabel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-primary">₹{d.amount.toString()}</td>
                  <td className="px-4 py-3 text-text-secondary">{d.purpose.name_en}</td>
                  <td className="px-4 py-3 text-text-secondary">{donationTypeLabel(d.donationType)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{d.receipt?.receiptNumber ?? <span className="text-text-secondary/50">—</span>}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(d.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/donations/${d.id}`}
                      className="group inline-flex items-center gap-1 font-medium text-secondary transition-colors hover:text-primary"
                    >
                      View
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* CARDS (mobile) */}
        <ul className="divide-y divide-border/60 md:hidden">
          {donations.map((d) => {
            const donorLabel = d.anonymous ? "Anonymous" : d.donorName;
            return (
              <li key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-light/25 text-xs font-semibold text-secondary"
                    >
                      {d.anonymous ? "—" : initialsOf(d.donorName)}
                    </span>
                    <p className="font-medium text-text-primary">{donorLabel}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-text-primary">₹{d.amount.toString()}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
                  <span>{d.purpose.name_en}</span>
                  <span aria-hidden="true">·</span>
                  <span>{donationTypeLabel(d.donationType)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge status={d.status} />
                  <span className="text-xs text-text-secondary">{formatDate(d.createdAt)}</span>
                </div>
                <p className="mt-2 font-mono text-xs text-text-secondary">
                  {d.receipt?.receiptNumber ?? <span className="text-text-secondary/50">No receipt</span>}
                </p>
                <Link
                  href={`/admin/donations/${d.id}`}
                  className="group mt-3 inline-flex items-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-primary"
                >
                  View Details
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>

        {donations.length === 0 && <DonationEmptyState hasActiveFilters={hasActiveFilters} />}

        {donations.length > 0 && (
          <div className="px-4 pb-4">
            <PaginationBar
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              totalCount={totalCount}
              pageSize={pageSize}
              page={page}
              totalPages={totalPages}
              buildHref={buildHref}
            />
          </div>
        )}
      </AdminTableCard>
    </div>
  );
}
