import { test, expect } from "@playwright/test";

// Converts the manual verification of the floating Donate CTA + quick-amount
// modal into a permanent regression test. The modal never talks to the
// payment gateway itself — it only hands an amount off to the existing
// /donate form via a query param, so this test's most important assertion
// is that the amount actually reaches and prefills that real, unmodified form.
test.describe("Floating donate button (global CTA)", () => {
  // Default locale is Tamil (RULE-018) — pin English so `has-text("Donate")`
  // selectors are deterministic across every test in this file.
  test.beforeEach(async ({ context }) => {
    await context.addCookies([{ name: "lang", value: "en", url: "http://localhost:3000" }]);
  });

  test("stays visible across public pages and while scrolling, but is hidden on /donate", async ({ page }) => {
    for (const path of ["/", "/news", "/events", "/gallery"]) {
      await page.goto(path);
      await expect(page.locator('button:has-text("Donate")').last()).toBeVisible();
    }

    await page.goto("/");
    await page.mouse.wheel(0, 1500);
    await expect(page.locator('button:has-text("Donate")').last()).toBeVisible();

    await page.goto("/donate");
    await expect(page.locator('button:has-text("Donate")')).toHaveCount(0);
  });

  test("opens the modal, selects a quick amount, and hands it off to the real donation form", async ({ page }) => {
    await page.goto("/");
    const floatingButton = page.locator('button:has-text("Donate")').last();
    await floatingButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator("#donation-modal-title")).toBeVisible();

    await page.click('button:has-text("₹1,000")');
    await page.click('button:has-text("Continue to Donate")');

    await page.waitForURL(/\/donate\?amount=1000/);
    await expect(page.locator("#amount")).toHaveValue("1000");
    // The real form is untouched — still requires donor name/mobile/purpose,
    // proving this is a prefill, not a bypass of the existing donation flow.
    await expect(page.locator("#donorName")).toBeVisible();
    await expect(page.locator("#mobile")).toBeVisible();
  });

  test("a custom amount deselects the quick-pick buttons and is used on continue", async ({ page }) => {
    await page.goto("/");
    await page.locator('button:has-text("Donate")').last().click();
    await page.click('button:has-text("₹500")');
    await expect(page.locator('button:has-text("₹500")')).toHaveAttribute("aria-pressed", "true");

    await page.fill('input[type="number"]', "777");
    await expect(page.locator('button:has-text("₹500")')).toHaveAttribute("aria-pressed", "false");

    await page.click('button:has-text("Continue to Donate")');
    await page.waitForURL(/\/donate\?amount=777/);
    await expect(page.locator("#amount")).toHaveValue("777");
  });

  test("closes via Escape (returning focus), backdrop click, and the close button — but not on an inside click", async ({ page }) => {
    await page.goto("/");
    const floatingButton = page.locator('button:has-text("Donate")').last();
    const dialog = page.locator('[role="dialog"]');

    await floatingButton.click();
    await expect(dialog).toBeVisible();
    await page.click("#donation-modal-title");
    await expect(dialog, "click inside the modal must not close it").toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(floatingButton).toBeFocused();

    await floatingButton.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(dialog).toBeHidden();

    await floatingButton.click();
    await expect(dialog).toBeVisible();
    await page.click('button[aria-label="Close"]');
    await expect(dialog).toBeHidden();
  });

  test("no horizontal overflow at mobile width with the button and modal both visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    let overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 1);

    await page.locator('button:has-text("Donate")').last().click();
    overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 1);
  });
});
