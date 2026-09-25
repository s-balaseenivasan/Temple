import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ArrowRight, CalendarPlus, HandCoins, IndianRupee, Mail, Newspaper, Receipt, Images } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();

  const [totalDonationsAgg, donationCount, pendingEnquiries] = await Promise.all([
    prisma.donation.aggregate({ where: { status: "success" }, _sum: { amount: true } }),
    prisma.donation.count(),
    prisma.contactEnquiry.count({ where: { status: "new" } }),
  ]);

  const totalRaised = totalDonationsAgg._sum.amount?.toNumber() ?? 0;

  const cards = [
    { label: "Total raised", note: "Successful donations", value: `₹${totalRaised.toLocaleString("en-IN")}`, icon: IndianRupee, href: "/admin/reports" },
    { label: "Donation records", note: "All statuses", value: donationCount.toLocaleString("en-IN"), icon: Receipt, href: "/admin/donations" },
    { label: "New enquiries", note: "Awaiting a response", value: pendingEnquiries.toLocaleString("en-IN"), icon: Mail, href: "/admin/contact-enquiries" },
  ];

  // Shortcuts to the most frequent data-entry screens — plain links to
  // existing routes, no new behaviour.
  const actions = [
    { label: "Publish news", href: "/admin/news/new", icon: Newspaper },
    { label: "Add an event", href: "/admin/events/new", icon: CalendarPlus },
    { label: "Record a donation", href: "/admin/donations", icon: HandCoins },
    { label: "New gallery album", href: "/admin/gallery/new", icon: Images },
  ];

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <div className="animate-admin-in mb-8 border-b border-border pb-6">
        <p className="kicker">{today}</p>
        <h1 className="admin-title mt-2">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Signed in as {session?.user.email} ({session?.user.role})
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c, i) => (
          <Link
            key={c.label}
            href={c.href}
            className="animate-admin-in group flex flex-col rounded-[14px] border border-border bg-surface p-5 transition-colors hover:border-primary/40"
            style={{ animationDelay: `${80 + i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">{c.label}</p>
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-primary">
                <c.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 truncate font-display text-[2rem] font-semibold leading-none tabular-nums text-text-primary">{c.value}</p>
            <p className="mt-3 flex items-center justify-between text-xs text-text-secondary">
              {c.note}
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Quick actions</h2>
      <div className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 bg-surface px-5 py-4 text-sm font-medium text-text-primary transition-colors hover:bg-background hover:text-primary"
          >
            <a.icon aria-hidden="true" className="h-4 w-4 text-primary" />
            <span className="flex-1">{a.label}</span>
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
