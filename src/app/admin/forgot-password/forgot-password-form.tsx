"use client";

import { useState } from "react";

export default function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    setSubmitting(false);

    // The API always returns the same generic 200 (RULE: avoid enumeration)
    // except for rate-limiting — the UI mirrors that: no distinction between
    // "email exists" and "email doesn't exist".
    if (res.status === 429) {
      setError("Too many attempts. Please try again later.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm text-success">
        If that email is registered, a password reset link has been sent. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="admin-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
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
        {submitting ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}
