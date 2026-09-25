"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AdminAuthShell from "@/components/admin-auth-shell";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Open-redirect guard: only same-site admin paths are honoured. A crafted
  // link like ?callbackUrl=https://evil.example (or protocol-relative
  // "//evil.example") would otherwise bounce a freshly signed-in admin to an
  // attacker's look-alike page.
  const requested = searchParams.get("callbackUrl");
  const callbackUrl = requested && /^\/admin(\/|$|\?)/.test(requested) && !requested.startsWith("//") ? requested : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    // FEAT-069/RULE-SEC: generic error only — never reveal whether the email
    // exists or the account is deactivated.
    if (!result || result.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AdminAuthShell
      title="Admin sign in"
      subtitle="Sign in with your temple admin account."
      footer={
        <Link href="/admin/forgot-password" className="admin-link">
          Forgot password?
        </Link>
      }
    >

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="admin-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="admin-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary h-11 w-full rounded-[10px]"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

    </AdminAuthShell>
  );
}
