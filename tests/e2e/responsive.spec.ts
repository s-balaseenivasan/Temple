import { test, expect } from "@playwright/test";
import { login, SUPER_ADMIN } from "./helpers";

// Cross-cutting responsive-breakpoint pass (blueprint IMPLEMENTATION_HANDOFF.md
// step 7). The single most common, most consequential responsive bug is
// horizontal overflow — content wider than the viewport forcing an
// unwanted horizontal scrollbar, which breaks the layout on real phones
// far more visibly than any spacing nitpick. Checking `scrollWidth` vs
// `clientWidth` catches this precisely and automatically across every
// page, instead of eyeballing a handful of screenshots and hoping nothing
// was missed off-screen.
const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

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

for (const bp of BREAKPOINTS) {
  for (const path of PUBLIC_PAGES) {
    test(`${path} has no horizontal overflow at ${bp.name} (${bp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(path);
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollWidth, `${path} at ${bp.width}px: scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}`).toBeLessThanOrEqual(
        overflow.clientWidth + 1, // 1px tolerance for sub-pixel rounding
      );
    });
  }
}

test.describe("Mobile nav (375px) actually works, not just fits", () => {
  test("hamburger opens the full destination list and every link navigates", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.click('button[aria-label="Toggle menu"], button[aria-label="பட்டியலைத் திற"]');
    // Scoped to the drawer itself — the homepage also has its own "View all
    // deities" links (desktop + mobile variants) pointing at the same href,
    // so a bare page-wide selector isn't guaranteed to land on the drawer's
    // own instance by DOM order alone.
    const drawerLink = page.locator('[role="dialog"] a[href="/deities"]');
    await expect(drawerLink).toBeVisible();
    await drawerLink.click();
    await page.waitForURL(/\/deities$/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

for (const bp of BREAKPOINTS) {
  test(`admin dashboard has no horizontal overflow at ${bp.name} (${bp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await login(page, SUPER_ADMIN);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
}
