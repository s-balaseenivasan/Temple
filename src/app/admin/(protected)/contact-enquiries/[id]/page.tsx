import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EnquiryActions from "./actions";

const ENQUIRER_LABELS: Record<string, string> = { pangali: "Pangali", bhaktar: "Bhaktar" };

export default async function AdminContactEnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enquiry = await prisma.contactEnquiry.findUnique({
    where: { id },
    include: { handledByAdmin: { select: { name: true, email: true } } },
  });
  if (!enquiry) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="admin-title mb-6">Contact Enquiry Detail</h1>

      <div className="admin-panel mb-6 text-sm">
        <Row label="Name" value={enquiry.name} />
        <Row label="Mobile" value={enquiry.mobile} />
        <Row label="Email" value={enquiry.email ?? "—"} />
        <Row label="Enquirer Type" value={ENQUIRER_LABELS[enquiry.enquirerType]} />
        <Row label="Status" value={enquiry.status} />
        <Row label="Submitted" value={enquiry.createdAt.toLocaleString("en-IN")} />
        {enquiry.handledByAdmin && <Row label="Last Handled By" value={`${enquiry.handledByAdmin.name} <${enquiry.handledByAdmin.email}>`} />}
        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="mb-1 text-text-secondary">Message</p>
          <p className="whitespace-pre-wrap text-text-primary">{enquiry.message}</p>
        </div>
      </div>

      <EnquiryActions enquiryId={enquiry.id} status={enquiry.status} />
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
