import Link from "next/link";
import { Flower2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export default function DonateButton({ locale, className = "" }: { locale: Locale; className?: string }) {
  const langClass = locale === "ta" ? "font-tamil" : "";
  return (
    <Link href="/donate" className={`btn btn-primary h-10 min-h-10 shrink-0 px-4 ${langClass} ${className}`}>
      <Flower2 aria-hidden="true" className="h-4 w-4" />
      {locale === "ta" ? "நன்கொடை" : "Donate"}
    </Link>
  );
}
