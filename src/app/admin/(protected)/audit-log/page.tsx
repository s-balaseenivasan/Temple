import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";

interface Props {
  searchParams: Promise<{ actorId?: string; action?: string; entityType?: string; from?: string; to?: string }>;
}

// FEAT-060 / PERM-000: Super-Admin-only. Middleware blocks this route prefix
// too, but this page-level check is the one that actually matters if that
// prefix list is ever misconfigured — never rely on middleware alone.
export default async function AuditLogPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user.role !== "SuperAdmin") redirect("/admin?error=forbidden");

  const sp = await searchParams;

  const where: Prisma.AuditLogWhereInput = {};
  if (sp.actorId) where.actorId = sp.actorId;
  if (sp.action) where.action = sp.action;
  if (sp.entityType) where.entityType = sp.entityType;
  if (sp.from || sp.to) {
    where.createdAt = {
      ...(sp.from ? { gte: new Date(sp.from) } : {}),
      ...(sp.to ? { lte: new Date(`${sp.to}T23:59:59`) } : {}),
    };
  }

  // Sequential, not Promise.all: four truly-concurrent queries were found
  // (via real browser verification) to intermittently exhaust/destabilize
  // the local `prisma dev` embedded Postgres connection handling ("Connection
  // terminated unexpectedly") — see IMPLEMENTATION_PROGRESS.md. This page is
  // low-traffic and not latency-sensitive, so sequential awaits are a
  // reasonable, low-risk fix rather than fighting the dev database's
  // concurrency ceiling; a real managed Postgres in production has no such
  // limit and would handle the parallel form fine, but there is no reason to
  // take the risk here for four cheap lookups on an internal admin page.
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { name: true, email: true } } },
  });
  const admins = await prisma.adminUser.findMany({ select: { id: true, name: true } });
  const distinctActions = await prisma.auditLog.findMany({ distinct: ["action"], select: { action: true } });
  const distinctEntities = await prisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true } });

  const inputClass = "admin-input w-auto";

  return (
    <div>
      <h1 className="admin-title mb-6">Audit Log</h1>

      <form method="GET" className="admin-panel mb-4 flex flex-wrap items-end gap-3 p-4 text-sm">
        <div>
          <label htmlFor="audit-filter-actor" className="mb-1 block text-xs font-medium text-text-secondary">Actor</label>
          <select id="audit-filter-actor" name="actorId" defaultValue={sp.actorId ?? ""} className={inputClass}>
            <option value="">All (incl. system)</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-filter-action" className="mb-1 block text-xs font-medium text-text-secondary">Action</label>
          <select id="audit-filter-action" name="action" defaultValue={sp.action ?? ""} className={inputClass}>
            <option value="">All</option>
            {distinctActions.map((a) => (
              <option key={a.action} value={a.action}>
                {a.action}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-filter-entity-type" className="mb-1 block text-xs font-medium text-text-secondary">Entity Type</label>
          <select id="audit-filter-entity-type" name="entityType" defaultValue={sp.entityType ?? ""} className={inputClass}>
            <option value="">All</option>
            {distinctEntities.map((e) => (
              <option key={e.entityType} value={e.entityType}>
                {e.entityType}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-filter-from" className="mb-1 block text-xs font-medium text-text-secondary">From</label>
          <input id="audit-filter-from" type="date" name="from" defaultValue={sp.from} className={inputClass} />
        </div>
        <div>
          <label htmlFor="audit-filter-to" className="mb-1 block text-xs font-medium text-text-secondary">To</label>
          <input id="audit-filter-to" type="date" name="to" defaultValue={sp.to} className={inputClass} />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          Filter
        </button>
      </form>

      <div className="space-y-2">
        {logs.map((log) => (
          <details key={log.id} className="admin-panel p-4 text-sm">
            <summary className="cursor-pointer">
              <span className="font-medium text-primary">{log.action}</span> on {log.entityType}
              {log.entityId ? ` (${log.entityId.slice(0, 8)}...)` : ""} — by{" "}
              <span className="text-text-secondary">{log.actor ? `${log.actor.name} <${log.actor.email}>` : "System"}</span> —{" "}
              <span className="text-text-secondary">{log.createdAt.toLocaleString("en-IN")}</span>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="mb-1 font-semibold text-text-secondary">Before</p>
                <pre className="overflow-x-auto rounded-lg bg-surface-muted p-2">{log.beforeJson ? JSON.stringify(log.beforeJson, null, 2) : "—"}</pre>
              </div>
              <div>
                <p className="mb-1 font-semibold text-text-secondary">After</p>
                <pre className="overflow-x-auto rounded-lg bg-surface-muted p-2">{log.afterJson ? JSON.stringify(log.afterJson, null, 2) : "—"}</pre>
              </div>
            </div>
          </details>
        ))}
        {logs.length === 0 && <p className="py-6 text-center text-text-secondary">No audit log entries match these filters.</p>}
      </div>
    </div>
  );
}
