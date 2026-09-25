import Link from "next/link";
import ForgotPasswordForm from "./forgot-password-form";
import AdminAuthShell from "@/components/admin-auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AdminAuthShell
      title="Reset your password"
      subtitle="Enter your admin account email and we'll send you a reset link."
      footer={
        <Link href="/admin/login" className="admin-link">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AdminAuthShell>
  );
}
