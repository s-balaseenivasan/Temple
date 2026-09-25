import Link from "next/link";
import { Plus } from "lucide-react";

export default function AdminPageHeader({
  title,
  subtitle,
  actionHref,
  actionLabel,
}: {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="animate-admin-in mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
      <div>
        <h1 className="admin-title">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="group btn btn-primary btn-sm"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden="true" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
