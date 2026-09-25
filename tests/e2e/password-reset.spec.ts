import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { login, SUPER_ADMIN } from "./helpers";

// FEAT-071: converts the manual verification of the real forgot/reset
// password flow into permanent regression tests. Uses a dedicated,
// disposable admin account (never SUPER_ADMIN/TEMPLE_ADMIN from helpers.ts)
// so a password change here never breaks other specs' fixtures.
test.describe("Password reset (FEAT-071)", () => {
  const db = new Client({ connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable" });
  const emailsDir = path.join(process.cwd(), ".data", "emails");

  test.beforeAll(async () => {
    await db.connect();
  });

  test.afterAll(async () => {
    await db.end();
    await rm(emailsDir, { recursive: true, force: true }).catch(() => {});
  });

  async function latestEmailTo(to: string) {
    const sanitized = to.replace(/[^a-z0-9@.]/gi, "_");
    const files = (await readdir(emailsDir).catch(() => [] as string[])).filter((f) => f.includes(sanitized));
    files.sort();
    const latest = files[files.length - 1];
    if (!latest) return null;
    return JSON.parse(await readFile(path.join(emailsDir, latest), "utf-8"));
  }

  test("forgot-password never reveals whether the email exists (same 200 either way)", async ({ request }) => {
    const unknownRes = await request.post("http://localhost:3000/api/auth/forgot-password", {
      data: { email: "definitely-nobody@temple.local" },
    });
    expect(unknownRes.status()).toBe(200);
  });

  test("full real flow: request reset, use the emailed token, old password stops working, new one works", async ({ page, request }) => {
    const tag = Date.now();
    const testEmail = `e2e-reset-${tag}@temple.local`;
    const originalPassword = "OriginalPass!123";
    const newPassword = "BrandNewPass!456";

    await login(page, SUPER_ADMIN);
    const createRes = await page.request.post("http://localhost:3000/api/admin/users", {
      data: { name: "E2E Reset Test", email: testEmail, role: "TempleAdmin", password: originalPassword },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    try {
      const forgotRes = await request.post("http://localhost:3000/api/auth/forgot-password", { data: { email: testEmail } });
      expect(forgotRes.status()).toBe(200);

      await page.waitForTimeout(300); // file write is async
      const email = await latestEmailTo(testEmail);
      expect(email).toBeTruthy();
      const token = email.text.match(/reset-password\/([0-9a-f]{64})/)?.[1];
      expect(token).toBeTruthy();

      const resetRes = await request.post("http://localhost:3000/api/auth/reset-password", { data: { token, newPassword } });
      expect(resetRes.status()).toBe(200);

      // Old password no longer works.
      await page.goto("/admin/login");
      await page.fill("#email", testEmail);
      await page.fill("#password", originalPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      expect(page.url()).toContain("/admin/login");

      // New password works.
      await page.fill("#email", testEmail);
      await page.fill("#password", newPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin$/, { timeout: 10000 });
      expect(page.url()).toContain("/admin");

      // Token is single-use.
      const reuseRes = await request.post("http://localhost:3000/api/auth/reset-password", {
        data: { token, newPassword: "AnotherOne!789" },
      });
      expect(reuseRes.status()).toBe(400);
    } finally {
      await db.query("DELETE FROM audit_logs WHERE \"entityId\" = $1", [created.id]);
      await db.query("DELETE FROM admin_users WHERE id = $1", [created.id]);
    }
  });

  test("reset with an invalid token is rejected", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/auth/reset-password", {
      data: { token: "a".repeat(64), newPassword: "WontWork!123" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_or_expired_token");
  });
});
