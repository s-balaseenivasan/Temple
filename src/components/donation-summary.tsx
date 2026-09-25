import { IndianRupee, CheckCircle2, Clock, HandCoins } from "lucide-react";

interface SummaryItem {
  label: string;
  amount: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

// Compact overview strip — every figure here comes from the same Prisma
// aggregate/groupBy queries already used by the admin dashboard page, scoped
// to whatever filter is currently applied on this page. Nothing here is a
// new business rule; it's read-only arithmetic over the existing schema.
export default function DonationSummary({
  total,
  successful,
  pending,
  offlineInKind,
}: {
  total: string;
  successful: string;
  pending: string;
  offlineInKind: string;
}) {
  const items: SummaryItem[] = [
    { label: "Total Donations", amount: total, icon: IndianRupee, accent: "bg-primary/10 text-primary" },
    { label: "Successful", amount: successful, icon: CheckCircle2, accent: "bg-success/10 text-success" },
    { label: "Pending", amount: pending, icon: Clock, accent: "bg-gold-light/30 text-secondary" },
    { label: "Offline / In-Kind", amount: offlineInKind, icon: HandCoins, accent: "bg-surface-muted text-text-secondary" },
  ];

  return (
    <div className="animate-admin-in mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.accent}`}>
            <item.icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase leading-tight text-text-secondary sm:tracking-wide">{item.label}</p>
            <p className="truncate text-lg font-semibold text-text-primary">₹{item.amount}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
