import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login, SUPER_ADMIN } from "./helpers";

// Cross-cutting accessibility pass (blueprint IMPLEMENTATION_HANDOFF.md step
// 7). Runs the real axe-core engine against rendered pages in both locales —
// static ESLint jsx-a11y linting (already in the toolchain via
// eslint-config-next) catches authoring mistakes, but only a real rendered-
// DOM scan catches issues that only exist after data/translations are
// merged in, like a missing accessible name on a dynamically-rendered icon
// button or a contrast issue in an actual computed color.
const PUBLIC_PAGES = [
  "/",
  "/news",
  "/events",
  "/gallery",
  "/videos",
  "/committee",
  "/pangaligal",
  "/documents",
  "/donate",
  "/deities",
  "/pooja-festivals",
  "/welfare",
  "/bhaktha-sabha",
  "/administration",
];

for (const path of PUBLIC_PAGES) {
  for (const locale of ["ta", "en"] as const) {
    test(`public page ${path} (${locale}) has no serious/critical axe violations`, async ({ page, context }) => {
      await context.addCookies([{ name: "lang", value: locale, url: "http://localhost:3000" }]);
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      if (serious.length) {
        console.log(`Violations on ${path} (${locale}):`, JSON.stringify(serious, null, 2));
      }
      expect(serious, `${path} (${locale}) had serious/critical violations`).toEqual([]);
    });
  }
}

test("admin dashboard has no serious/critical axe violations", async ({ page }) => {
  await login(page, SUPER_ADMIN);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (serious.length) {
    console.log("Violations on /admin:", JSON.stringify(serious, null, 2));
  }
  expect(serious).toEqual([]);
});

test("admin login page has no serious/critical axe violations", async ({ page }) => {
  await page.goto("/admin/login");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious).toEqual([]);
});

// Admin CMS forms and filter bars — added after the accessibility pass found
// a dozen unlabeled `<select>`/`<input>` elements across these exact pages
// (visible label text next to the field, but no `htmlFor`/`id` or
// `aria-label` wiring an assistive-tech user could actually use). Each of
// these pages is scanned so that fix stays verified, not just applied.
const ADMIN_CRUD_PAGES = [
  "/admin/news/new",
  "/admin/events/new",
  "/admin/gallery/new",
  "/admin/videos/new",
  "/admin/committee/new",
  "/admin/documents/new",
  "/admin/donations",
  "/admin/donation-purposes",
  "/admin/designations",
  "/admin/event-categories",
  "/admin/users",
  "/admin/audit-log",
  "/admin/reports",
];

for (const path of ADMIN_CRUD_PAGES) {
  test(`admin page ${path} has no serious/critical axe violations`, async ({ page }) => {
    await login(page, SUPER_ADMIN);
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    if (serious.length) {
      console.log(`Violations on ${path}:`, JSON.stringify(serious, null, 2));
    }
    expect(serious, `${path} had serious/critical violations`).toEqual([]);
  });
}
