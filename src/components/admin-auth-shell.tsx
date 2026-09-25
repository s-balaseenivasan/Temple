import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GopuramSilhouette, LotusIcon } from "@/components/decorative";

// Shared frame for the signed-out admin screens (sign in, forgot password,
// reset password): a maroon brand panel beside a paper form column. The
// brand panel collapses away below lg so the form is the whole screen on
// phones.
export default function AdminAuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-primary text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pattern-kolam pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden="true" />
        <GopuramSilhouette className="pointer-events-none absolute -bottom-10 -right-10 h-[70%] w-auto text-gold-light/20" />
        <div className="relative flex items-center gap-3">
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-light text-ink">
            <LotusIcon className="h-6 w-6" />
          </span>
          <span className="font-display text-lg font-semibold">Sri Gurusamy Sri Ananthammal Temple</span>
        </div>
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-light">Management console</p>
          <p className="mt-4 font-display text-4xl font-semibold leading-tight">Caring for the temple, one record at a time.</p>
          <p className="font-tamil mt-6 text-white/80">முன்னோர் வழி – தெய்வ பக்தி – பங்காளிகள் ஒற்றுமை</p>
        </div>
        <p className="relative text-xs text-white/70">Thirumangalam · Madurai District · Tamil Nadu</p>
      </div>

      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="link-arrow self-start">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to website
        </Link>
        <div className="flex flex-1 items-start justify-center pb-10 pt-8 lg:items-center lg:py-10">
          <div className="w-full max-w-sm">
            <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/70 bg-surface text-primary lg:hidden">
              <LotusIcon className="h-6 w-6" />
            </span>
            <h1 className="admin-title mt-6 text-[2rem] lg:mt-0">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm">{footer}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
