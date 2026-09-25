import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// FEAT-052 / PERM: Super-Admin-only. Deliberately a READ-ONLY status view, not
// a credential-editing form — see the architectural note below and
// IMPLEMENTATION_PROGRESS.md for the full reasoning. SECURITY_REQUIREMENTS.md
// and DATA_MODEL.md both describe gateway credentials as "encrypted secret
// storage — not modeled as a plain entity"; building a form that writes a
// Razorpay secret key into a regular database column via this admin panel
// would directly contradict that requirement, not satisfy it. Real credential
// management belongs in the deployment platform's environment/secret manager
// (per TECHNICAL_ARCHITECTURE.md's secrets-management section), which this
// screen surfaces the *status* of without ever handling the secret value.
export default async function PaymentGatewaySettingsPage() {
  const session = await auth();
  if (session?.user.role !== "SuperAdmin") redirect("/admin?error=forbidden");

  const provider = process.env.PAYMENT_PROVIDER ?? "mock";
  const isMock = provider === "mock";
  const razorpayConfigured = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET && !!process.env.RAZORPAY_WEBHOOK_SECRET;

  const recentPaymentActions = await prisma.auditLog.findMany({
    where: { entityType: "Payment" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="max-w-2xl">
      <h1 className="admin-title mb-6">Payment Gateway</h1>

      <div className="admin-panel mb-6 text-sm">
        <p className="mb-2">
          Active provider: <span className="font-medium">{provider}</span>
        </p>
        {isMock && (
          <p className="rounded-xl border border-gold/60 bg-gold-light/15 p-3 text-primary-dark">
            Running in <strong>mock mode</strong> — no real gateway is connected. This is expected for local
            development. The final production gateway is still an open decision (CR-001 in the blueprint).
          </p>
        )}
        {!isMock && provider === "razorpay" && (
          <p className={`rounded-xl border p-3 ${razorpayConfigured ? "border-success/30 bg-success/5 text-success" : "border-error/30 bg-error/5 text-error"}`}>
            Razorpay credentials {razorpayConfigured ? "are configured" : "are NOT fully configured"} via server
            environment variables.
          </p>
        )}
      </div>

      <div className="admin-panel mb-6 text-sm">
        <h2 className="mb-2 font-semibold text-text-secondary">Why credentials aren&apos;t edited here</h2>
        <p className="text-text-secondary">
          Payment gateway API keys and webhook secrets are sensitive credentials. They are configured via the
          server&apos;s environment variables (<code>PAYMENT_PROVIDER</code>, <code>RAZORPAY_KEY_ID</code>,{" "}
          <code>RAZORPAY_KEY_SECRET</code>, <code>RAZORPAY_WEBHOOK_SECRET</code>) rather than through this panel,
          so they are never stored in the application database in plain text and never pass through a browser
          session. To change them, update the environment configuration on the hosting platform and redeploy.
        </p>
      </div>

      <div className="admin-panel text-sm">
        <h2 className="mb-2 font-semibold text-text-secondary">Recent Payment-Related Audit Events</h2>
        {recentPaymentActions.length === 0 ? (
          <p className="text-text-secondary">No payment events recorded yet.</p>
        ) : (
          <ul className="space-y-1">
            {recentPaymentActions.map((a) => (
              <li key={a.id} className="text-xs text-text-secondary">
                {a.action} — {a.createdAt.toLocaleString("en-IN")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
