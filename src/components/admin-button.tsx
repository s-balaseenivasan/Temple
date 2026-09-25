import Link from "next/link";
import { LockKeyhole } from "lucide-react";

// Deliberately quiet — staff sign-in shouldn't compete with Donate for a
// devotee's attention, but it stays one click away in the header.
export default function AdminButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/admin/login"
      className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary ${className}`}
    >
      <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />
      Admin
    </Link>
  );
}
