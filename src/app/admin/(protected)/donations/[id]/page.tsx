import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import DonationDetailActions from "./actions";

export default async function AdminDonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const donation = await prisma.donation.findUnique({
    where: { id },
    include: {
      purpose: true,
      payments: true, // FEAT-048: full payment trail; empty array for offline/in-kind, not an error state
      receipt: true,
      recordedByAdmin: { select: { name: true, email: true } },
    },
  });

  if (!donation) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="admin-title mb-6">Donation Detail</h1>

      <div className="admin-panel mb-6 text-sm">
        <Row label="Donor" value={donation.anonymous ? `${donation.donorName} (marked anonymous publicly)` : donation.donorName} />
        <Row label="Mobile" value={donation.mobile} />
        <Row label="Email" value={donation.email ?? "—"} />
        <Row label="PAN" value={donation.pan ?? "—"} />
        <Row label="Amount" value={`₹${donation.amount.toString()}`} />
        <Row label="Purpose" value={donation.purpose.name_en} />
        <Row label="Donation Type" value={donation.donationType} />
        {donation.valuationNote && <Row label="Valuation Note" value={donation.valuationNote} />}
        <Row label="Status" value={donation.status} />
        {donation.recordedByAdmin && <Row label="Recorded By (offline entry)" value={`${donation.recordedByAdmin.name} <${donation.recordedByAdmin.email}>`} />}
        <Row label="Created" value={donation.createdAt.toLocaleString("en-IN")} />
      </div>

      <div className="admin-panel mb-6 text-sm">
        <h2 className="mb-2 font-semibold text-text-secondary">Payment Attempts</h2>
        {donation.payments.length === 0 ? (
          <p className="text-text-secondary">
            No payment attempts — this is an offline/in-kind donation (donationType={donation.donationType}), which
            never involves the payment gateway by design.
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-text-secondary">
                <th>Provider</th>
                <th>Order ID</th>
                <th>Payment ID</th>
                <th>Status</th>
                <th>Verified At</th>
              </tr>
            </thead>
            <tbody>
              {donation.payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.provider}</td>
                  <td className="font-mono">{p.providerOrderId}</td>
                  <td className="font-mono">{p.providerPaymentId ?? "—"}</td>
                  <td>{p.status}</td>
                  <td>{p.verifiedAt ? p.verifiedAt.toLocaleString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-panel text-sm">
        <h2 className="mb-2 font-semibold text-text-secondary">Receipt</h2>
        {donation.receipt ? (
          <>
            <Row label="Receipt No." value={donation.receipt.receiptNumber} />
            <Row label="Issued At" value={donation.receipt.issuedAt.toLocaleString("en-IN")} />
            <Row label="80G Clause Included" value={donation.receipt.includes80GClause ? "Yes" : "No"} />
            {donation.status === "refunded" && (
              <p className="mt-2 inline-block rounded-full bg-gold-light/30 px-2.5 py-1 text-xs font-medium text-primary-dark">
                REFUNDED — this receipt remains on record as historically accurate (RULE-022)
              </p>
            )}
          </>
        ) : (
          <p className="text-text-secondary">No receipt issued yet.</p>
        )}

        <DonationDetailActions
          donationId={donation.id}
          receiptId={donation.receipt?.id ?? null}
          status={donation.status}
          isSuperAdmin={session?.user.role === "SuperAdmin"}
        />
      </div>
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
