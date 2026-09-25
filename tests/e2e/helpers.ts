import type { Page } from "@playwright/test";

export const SUPER_ADMIN = { email: "admin@temple.local", password: "ChangeMe!12345" };
export const TEMPLE_ADMIN = { email: "office@temple.local", password: "ChangeMe!12345" };

export async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/admin/login");
  await page.fill("#email", creds.email);
  await page.fill("#password", creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin$/, { timeout: 10000 });
}
