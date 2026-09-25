"use server";

import { signOut } from "@/auth";

// Extracted into its own "use server" file so the sidebar (now a client
// component, needed for the mobile drawer's open/close state) can still
// invoke the exact same sign-out logic as a server action — no change to
// auth behavior itself, only where the action is defined.
export async function signOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
