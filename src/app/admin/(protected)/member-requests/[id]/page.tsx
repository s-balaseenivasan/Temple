import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RequestActions from "./actions";

export default async function AdminMemberRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await prisma.memberRequest.findUnique({
    where: { id },
    include: { handledByAdmin: { select: { name: true, email: true } } },
  });
  if (!request) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="admin-title mb-6">Member Request Detail</h1>

      <div className="admin-panel mb-6 text-sm">
        <Row label="Pangali Name" value={request.pangaliName} />
        <Row label="Family Representative" value={request.familyRepresentativeName} />
        <Row label="Mobile" value={request.mobile} />
        <Row label="Email" value={request.email ?? "—"} />
        <Row label="Lineage Branch" value={request.lineageBranch ?? "—"} />
        <Row label="Request Type" value={request.requestType} />
        <Row label="Status" value={request.status} />
        <Row label="Submitted" value={request.createdAt.toLocaleString("en-IN")} />
        {request.handledByAdmin && <Row label="Last Handled By" value={`${request.handledByAdmin.name} <${request.handledByAdmin.email}>`} />}
        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="mb-1 text-text-secondary">Details</p>
          <p className="whitespace-pre-wrap text-text-primary">{request.details}</p>
        </div>
      </div>

      <RequestActions requestId={request.id} status={request.status} adminNotes={request.adminNotes} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-1 last:border-0">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}
