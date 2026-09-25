"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const newPassword = form.get("newPassword") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setSubmitting(false);
      setError("Passwords do not match.");
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.error === "invalid_or_expired_token") {
        setError("This reset link is invalid or has expired. Please request a new one.");
      } else if (body?.details?.fieldErrors?.newPassword?.[0]) {
        setError(body.details.fieldErrors.newPassword[0]);
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/admin/login"), 2000);
  }

  if (success) {
    return (
      <p className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm text-success">
        Your password has been reset. Redirecting to sign in...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="newPassword" className="admin-label">
          New Password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="admin-input"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="admin-label">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="admin-input"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary btn-sm w-full"
      >
        {submitting ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}
