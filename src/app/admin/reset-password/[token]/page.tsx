import ResetPasswordForm from "./reset-password-form";
import AdminAuthShell from "@/components/admin-auth-shell";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <AdminAuthShell title="Set a new password" subtitle="Choose a new password for your admin account.">
      <ResetPasswordForm token={token} />
    </AdminAuthShell>
  );
}
