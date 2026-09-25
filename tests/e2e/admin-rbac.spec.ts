import { test, expect } from "@playwright/test";
import { login, SUPER_ADMIN, TEMPLE_ADMIN } from "./helpers";

// PERM-000 (ROLES_AND_PERMISSIONS.md): every permission must be enforced
// server-side, never just hidden in the UI. These tests check BOTH layers
// independently for the highest-stakes actions (refund, admin-user
// management) — this is the same double-check performed by hand during
// development, now permanent.
test.describe("RBAC — Super-Admin-only actions", () => {
  test("unauthenticated visitor is redirected away from /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("Temple Admin cannot reach Admin Users or Audit Log (page-level redirect)", async ({ page }) => {
    await login(page, TEMPLE_ADMIN);

    await page.goto("/admin/users");
    await expect(page).toHaveURL(/error=forbidden/);

    await page.goto("/admin/audit-log");
    await expect(page).toHaveURL(/error=forbidden/);
  });

  test("Temple Admin's direct API call to admin-users list is rejected with 403, not just hidden in the UI", async ({ page }) => {
    await login(page, TEMPLE_ADMIN);
    const res = await page.request.get("/api/admin/users");
    expect(res.status()).toBe(403);
  });

  test("Super Admin CAN reach Admin Users and Audit Log", async ({ page }) => {
    await login(page, SUPER_ADMIN);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users$/);
    await page.goto("/admin/audit-log");
    await expect(page).toHaveURL(/\/admin\/audit-log$/);
  });
});

test.describe("RBAC — last Super Admin protection (RULE-029)", () => {
  test("the server rejects deactivating the only remaining active Super Admin, even via a direct API call bypassing the disabled UI button", async ({ page }) => {
    await login(page, SUPER_ADMIN);
    const usersRes = await page.request.get("/api/admin/users");
    const users = await usersRes.json();
    const soleSuperAdmin = users.find((u: { email: string }) => u.email === SUPER_ADMIN.email);
    expect(soleSuperAdmin).toBeTruthy();

    const res = await page.request.patch(`/api/admin/users/${soleSuperAdmin.id}`, {
      data: { status: "inactive" },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("last_super_admin");
  });
});
