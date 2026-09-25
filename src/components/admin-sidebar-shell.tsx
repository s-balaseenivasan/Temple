"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ExternalLink } from "lucide-react";
import AdminSidebar from "@/components/admin-sidebar";
import { LotusIcon } from "@/components/decorative";
import { signOutAction } from "@/app/admin/(protected)/actions";

// Real fixed-position sidebar architecture, replacing the previous
// flex-row-sibling layout that let both the sidebar's nav AND the page
// itself scroll independently (the actual root cause of the "sidebar has
// its own scrollbar, main page also has a scrollbar" complaint — a
// position:fixed sidebar simply never participates in page scroll at all).
//
// Three fixed regions inside the aside (header / nav / footer): only the
// middle nav region scrolls, via flex-1 + min-h-0 + overflow-y-auto; header
// and footer are normal flow siblings so they can never be pushed off
// screen by nav content, matching the brief's "sidebar → header fixed,
// nav scrollable, footer fixed" architecture exactly.
//
// On mobile this same three-region aside becomes an off-canvas drawer
// (translate-x-full when closed), toggled by a small top bar with a
// hamburger button that only renders below the md breakpoint.
export default function AdminSidebarShell({
  isSuperAdmin,
  userName,
  userRole,
}: {
  isSuperAdmin: boolean;
  userName: string;
  userRole: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close the drawer on every navigation — otherwise clicking a link would
  // leave the drawer open over the newly-loaded page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [open]);

  const brand = (
    <Link href="/admin" className="flex items-center gap-3 px-4 py-4">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/70 bg-background text-primary"
      >
        <LotusIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-[0.95rem] font-semibold text-text-primary">Temple Admin</p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">Management console</p>
      </div>
    </Link>
  );

  const footer = (
    <div className="border-t border-border p-3">
      <div className="flex items-center justify-between gap-1 rounded-xl border border-border bg-background p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">{userName}</p>
          <span
            className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isSuperAdmin ? "bg-primary/10 text-primary" : "bg-gold-light/30 text-primary-dark"
            }`}
          >
            {userRole}
          </span>
        </div>
        <Link
          href="/"
          aria-label="View website"
          title="View website"
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-error"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar — the only place the hamburger trigger lives */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-2 py-2 md:hidden">
        {brand}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          className="mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-primary"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Backdrop — mobile only, only rendered while the drawer is open */}
      {open && (
        <div
          className="animate-fade-in fixed inset-0 z-40 bg-ink/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* The sidebar itself: fixed full-height at all sizes. On mobile it's
          translated off-screen unless `open`; on desktop (md:) it's always
          pinned at translate-x-0 and the transform/backdrop machinery is inert. */}
      <aside
        role={open ? "dialog" : undefined}
        aria-modal={open ? "true" : undefined}
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface transition-transform duration-200 ease-out md:w-64 md:max-w-none md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex-1">{brand}</div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-background hover:text-primary md:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* min-h-0 is load-bearing: without it this flex-1 child refuses to
            shrink below its content's natural height, overflow-y-auto never
            engages, and nav content is silently clipped instead of becoming
            scrollable — the actual root cause of an earlier version of this
            bug, found via direct scrollHeight/clientHeight measurement. */}
        <div className="admin-nav-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <AdminSidebar isSuperAdmin={isSuperAdmin} />
        </div>

        {footer}
      </aside>
    </>
  );
}
