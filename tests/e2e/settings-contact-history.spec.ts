import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { login, SUPER_ADMIN, TEMPLE_ADMIN } from "./helpers";

// Converts the manual verification of the newly-built FEAT-002/010/011/012/
// 025/026/061/062/063 features into permanent regression tests.
test.describe("Admin Settings (FEAT-061/062/063)", () => {
  const db = new Client({ connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable" });

  test.beforeAll(async () => {
    await db.connect();
  });

  test.afterAll(async () => {
    await db.end();
  });

  test("general settings form saves and persists (phone is optional, not required)", async ({ page }) => {
    const tag = Date.now();
    await login(page, SUPER_ADMIN);
    await page.goto("/admin/settings");
    await page.waitForLoadState("networkidle");

    for (let i = 0; i < 5; i++) {
      await page.fill("#templeName_en", `E2E Temple Name ${tag}`);
      if ((await page.inputValue("#templeName_en")) === `E2E Temple Name ${tag}`) break;
      await page.waitForTimeout(300);
    }

    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/admin/settings") && r.request().method() === "PUT"),
      // Scoped to the settings form specifically — the sidebar's own Sign-out
      // button is also `button[type="submit"]` and comes first in DOM order,
      // so an unscoped selector would sign the session out instead (found
      // the hard way while building this).
      page.locator("#templeName_en").locator("xpath=ancestor::form").locator('button[type="submit"]').click(),
    ]);
    expect(resp.status()).toBe(200);

    const { rows } = await db.query('SELECT "templeName_en" FROM site_settings');
    expect(rows[0].templeName_en).toBe(`E2E Temple Name ${tag}`);

    await db.query('UPDATE site_settings SET "templeName_en" = $1', ["Sri Gurusamy Sri Ananthammal Temple"]);
  });

  test("timings PUT rejects duplicate override dates", async ({ page }) => {
    await login(page, SUPER_ADMIN);
    const res = await page.request.put("http://localhost:3000/api/admin/settings/timings", {
      data: {
        morning: { open: "06:00", close: "12:00" },
        evening: { open: "16:00", close: "20:00" },
        specialDayOverrides: [
          { date: "2026-01-01", open: "05:00", close: "22:00" },
          { date: "2026-01-01", open: "05:00", close: "22:00" },
        ],
      },
    });
    expect(res.status()).toBe(400);
  });

  test("80G toggle is Super-Admin-only, enforced server-side", async ({ page }) => {
    await login(page, SUPER_ADMIN);
    const superRes = await page.request.patch("http://localhost:3000/api/admin/settings/80g", {
      data: { is80GRegistered: true },
    });
    expect(superRes.status()).toBe(200);
    await db.query('UPDATE site_settings SET "is80GRegistered" = false');

    await login(page, TEMPLE_ADMIN);
    const taRes = await page.request.patch("http://localhost:3000/api/admin/settings/80g", {
      data: { is80GRegistered: true },
    });
    expect(taRes.status()).toBe(403);
  });
});

test.describe("Contact (FEAT-011/012/025/026)", () => {
  const db = new Client({ connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable" });

  test.beforeAll(async () => {
    await db.connect();
  });

  test.afterAll(async () => {
    await db.end();
  });

  test("public submission requires enquirerType and appears in the admin inbox", async ({ page, request }) => {
    const tag = Date.now();
    const missingType = await request.post("http://localhost:3000/api/contact", {
      data: { name: "No Type", mobile: "9812340030", message: "test" },
    });
    expect(missingType.status()).toBe(400);

    const createRes = await request.post("http://localhost:3000/api/contact", {
      data: { name: `E2E Contact ${tag}`, mobile: "9812340031", enquirerType: "pangali", message: "Hello" },
    });
    expect(createRes.status()).toBe(201);
    const { id } = await createRes.json();

    await login(page, SUPER_ADMIN);
    await page.goto("/admin/contact-enquiries");
    await expect(page.getByText(`E2E Contact ${tag}`)).toBeVisible();

    const statusRes = await page.request.patch(`http://localhost:3000/api/admin/contact-enquiries/${id}`, {
      data: { status: "closed" },
    });
    expect(statusRes.status()).toBe(200);

    await db.query("DELETE FROM contact_enquiries WHERE id = $1", [id]);
  });

  test("Contact page degrades gracefully with no map coordinates", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator("form")).toBeVisible();
  });
});

test.describe("History Timeline (FEAT-002)", () => {
  const db = new Client({ connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable" });

  test.beforeAll(async () => {
    await db.connect();
  });

  test.afterAll(async () => {
    await db.end();
  });

  test("draft entries are hidden from the public page, published entries are shown", async ({ page }) => {
    const tag = Date.now();
    await login(page, SUPER_ADMIN);

    const createRes = await page.request.post("http://localhost:3000/api/admin/history", {
      data: { year: "2001", title_en: `E2E History ${tag}`, sortOrder: 0 },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    try {
      await page.goto("/history");
      await expect(page.getByText(`E2E History ${tag}`)).toHaveCount(0);

      const publishRes = await page.request.patch(`http://localhost:3000/api/admin/history/${created.id}`, {
        data: { status: "published" },
      });
      expect(publishRes.status()).toBe(200);

      await page.goto("/history");
      await expect(page.getByText(`E2E History ${tag}`)).toBeVisible();
    } finally {
      await db.query("DELETE FROM history_timeline_entries WHERE id = $1", [created.id]);
    }
  });
});
