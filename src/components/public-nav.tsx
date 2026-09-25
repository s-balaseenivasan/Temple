import Link from "next/link";
import MoreDropdown from "@/components/more-dropdown";
import type { Locale } from "@/lib/i18n";

export interface NavItem {
  href: string;
  label: string;
}

// Desktop-only primary nav row (Home/News/Events/Gallery) + the More
// dropdown. Donate and Admin are rendered as their own components in
// SiteHeader — they're calls to action, not plain destinations, so they get
// distinct visual treatment instead of blending into this link row.
export default function PublicNav({
  primary,
  more,
  locale,
  activePath,
}: {
  primary: NavItem[];
  more: NavItem[];
  locale: Locale;
  activePath: string;
}) {
  const langClass = locale === "ta" ? "font-tamil" : "";
  const isActive = (href: string) => (href === "/" ? activePath === "/" : activePath.startsWith(href));
  const linkClass = (active: boolean) =>
    `relative flex h-10 items-center text-sm font-medium transition-colors ${langClass} ${
      active
        ? "text-primary after:absolute after:inset-x-0 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary"
        : "text-text-secondary hover:text-primary"
    }`;

  return (
    <nav aria-label={locale === "ta" ? "முதன்மை" : "Primary"} className="hidden items-center gap-6 lg:flex">
      {primary.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={linkClass(isActive(item.href))}
        >
          {item.label}
        </Link>
      ))}
      <MoreDropdown items={more} locale={locale} />
    </nav>
  );
}
