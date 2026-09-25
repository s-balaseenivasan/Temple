"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  CalendarDays,
  Image as ImageIcon,
  Video,
  Users,
  UserPlus,
  Mail,
  FileText,
  BookOpen,
  Settings,
  HandCoins,
  BarChart3,
  Tags,
  UserCog,
  ScrollText,
  CreditCard,
  Landmark,
} from "lucide-react";

interface NavEntry {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavEntry[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/news", label: "News", icon: Newspaper },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/deities", label: "Deities", icon: Landmark },
      { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
      { href: "/admin/videos", label: "Videos", icon: Video },
      { href: "/admin/history", label: "History Timeline", icon: BookOpen },
      { href: "/admin/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/admin/committee", label: "Committee", icon: Users },
      { href: "/admin/member-requests", label: "Member Requests", icon: UserPlus },
      { href: "/admin/contact-enquiries", label: "Contact Enquiries", icon: Mail },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/donations", label: "Donations", icon: HandCoins },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/donation-purposes", label: "Donation Purposes", icon: Tags },
    ],
  },
  {
    label: "Configuration",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

const SUPER_ADMIN_GROUP: NavGroup = {
  label: "Super Admin",
  items: [
    { href: "/admin/users", label: "Admin Users", icon: UserCog },
    { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
    { href: "/admin/settings/payment-gateway", label: "Payment Gateway", icon: CreditCard },
  ],
};

// Nav-only component: no positioning/scroll-container opinions of its own
// (that's AdminSidebarShell's job) beyond filling whatever space it's given.
// Used identically for the desktop fixed sidebar and the mobile drawer.
export default function AdminSidebar({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const groups = isSuperAdmin ? [...GROUPS, SUPER_ADMIN_GROUP] : GROUPS;
  const activeRef = useRef<HTMLAnchorElement>(null);

  // If the current page's own link isn't already on screen when the nav is
  // taller than its scroll area, scroll it into view so a user is never left
  // wondering "where am I" or "did this link disappear".
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <nav className="flex flex-col gap-0.5">
      {groups.map((group) => (
        <div key={group.label} className="mb-1.5">
          <p className="mb-1.5 mt-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary/90">{group.label}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  ref={active ? activeRef : undefined}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] transition-colors ${
                    active
                      ? "bg-primary/[0.07] font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary"
                      : "text-text-secondary hover:bg-background hover:text-text-primary"
                  }`}
                >
                  <Icon className={`h-[17px] w-[17px] shrink-0 ${active ? "text-primary" : "text-text-secondary/80 group-hover:text-primary"}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
