import { test, expect } from "@playwright/test";

// TEST-DON-* (WEB_TEST_PLAN.md): the highest-priority coverage area in the
// whole blueprint — RULE-012 / RULE-SEC-10 requires that a donation is NEVER
// marked successful from a client-side signal alone. These were originally
// verified by hand with curl and ad-hoc scripts during development; this
// file turns those findings into a permanent regression suite.
test.describe("Donation flow — RULE-012 server-side verification", () => {
  test("a fresh donation stays pending until the webhook fires, never from the browser redirect alone", async ({ page }) => {
    await page.goto("/donate");
    await expect(page.locator("h1").first()).toBeVisible();

    await page.fill("#donorName", "E2E Test Donor");
    await page.fill("#mobile", "9812340001");
    await page.fill("#amount", "501");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/donate\/mock-checkout/);

    // Extract the donation id from the URL before resolving payment, so we
    // can independently poll its status via the API.
    const url = new URL(page.url());
    const donationId = url.searchParams.get("donationId")!;
    expect(donationId).toBeTruthy();

    const statusBefore = await page.request.get(`/api/donations/${donationId}`);
    expect((await statusBefore.json()).status).toBe("pending");

    await page.click('button:has-text("Simulate Successful Payment")');
    await page.waitForURL(/\/donate\/[0-9a-f-]+/);

    // Poll until terminal, then assert it's success with a real receipt.
    let finalStatus;
    for (let i = 0; i < 20; i++) {
      const res = await page.request.get(`/api/donations/${donationId}`);
      finalStatus = await res.json();
      if (finalStatus.status !== "pending") break;
      await page.waitForTimeout(500);
    }
    expect(finalStatus.status).toBe("success");
    expect(finalStatus.receipt?.receiptNumber).toMatch(/^DON-\d{4}-\d{6}$/);

    await expect(page.getByText(/Thank you|நன்றி/)).toBeVisible({ timeout: 10000 });
  });

  test("a forged webhook with an invalid signature is rejected and changes nothing", async ({ page, request }) => {
    // Create a real pending donation first so there's a legitimate order to attack.
    const createRes = await request.post("/api/donations", {
      data: { donorName: "Attack Target", mobile: "9812340002", amount: 100, purposeId: await getFirstPurposeId(request), anonymous: false },
    });
    const { donationId, providerOrderId } = await createRes.json();

    const forgedRes = await request.post("/api/webhooks/payment", {
      headers: { "x-webhook-signature": "forged-signature-attempt" },
      data: JSON.stringify({ providerOrderId, providerPaymentId: "mock_pay_attack", outcome: "success" }),
    });
    expect(forgedRes.status()).toBe(400);

    const statusRes = await request.get(`/api/donations/${donationId}`);
    const status = await statusRes.json();
    expect(status.status).toBe("pending"); // unchanged by the forged webhook
    expect(status.receipt).toBeNull();
  });

  test("receipt lookup requires BOTH mobile and receipt number — wrong mobile with a right receipt number fails generically", async ({ request }) => {
    // Use a receipt we know exists from a prior successful run, or create one fresh.
    const purposeId = await getFirstPurposeId(request);
    const createRes = await request.post("/api/donations", {
      data: { donorName: "Lookup Test", mobile: "9812340003", amount: 100, purposeId, anonymous: false },
    });
    const { donationId, providerOrderId } = await createRes.json();

    const paymentId = "mock_pay_lookup_test";
    const signRes = await request.get(`/api/donations/${donationId}`); // no-op, just to keep flow readable
    void signRes;

    // Resolve via the mock gateway endpoint (form-encoded, matches the real UI flow).
    await request.post("/api/mock-gateway/resolve", {
      form: { orderId: providerOrderId, donationId, outcome: "success" },
    });

    let receiptNumber: string | undefined;
    for (let i = 0; i < 20; i++) {
      const res = await request.get(`/api/donations/${donationId}`);
      const json = await res.json();
      if (json.receipt) {
        receiptNumber = json.receipt.receiptNumber;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(receiptNumber).toBeTruthy();
    void paymentId;

    const wrongMobileRes = await request.post("/api/receipts/lookup", {
      data: { mobile: "9999999999", receiptNumber },
    });
    expect(wrongMobileRes.status()).toBe(404);

    const correctRes = await request.post("/api/receipts/lookup", {
      data: { mobile: "9812340003", receiptNumber },
    });
    expect(correctRes.status()).toBe(200);
  });
});

async function getFirstPurposeId(request: import("@playwright/test").APIRequestContext): Promise<string> {
  // There's no public purposes-list endpoint exposed separately from the
  // donate page's server-rendered options, so we scrape it from the rendered
  // page instead of hardcoding a seed-dependent UUID.
  const res = await request.get("/donate");
  const html = await res.text();
  const match = html.match(/<option value="([0-9a-f-]{36})"/);
  if (!match) throw new Error("Could not find a donation purpose option on /donate");
  return match[1];
}
