import { test, expect } from "@playwright/test";

// Hardening pass: public POST endpoints with no login requirement (donation
// creation, member-request submission) are now rate-limited per IP. Each
// test sends a synthetic, unique `X-Forwarded-For` value so it gets its own
// isolated bucket in the in-process limiter — real requests from other
// specs (or a previous run within the same dev-server process) share a
// single "unknown" bucket when no header is present, and a shared-bucket
// test would be order-dependent on how much of that budget other tests had
// already spent.
test.describe("Rate limiting on public forms", () => {
  test("member-request submission is rate-limited after 5 requests from the same IP within the window", async ({ request }) => {
    const fakeIp = `203.0.113.${Math.floor(Math.random() * 254) + 1}`;
    const payload = {
      requestType: "registration",
      pangaliName: "Rate Limit Test",
      familyRepresentativeName: "Rate Limit Test",
      mobile: "9812340099",
      details: "Testing rate limiting.",
    };

    for (let i = 0; i < 5; i++) {
      const res = await request.post("/api/member-requests", {
        headers: { "x-forwarded-for": fakeIp },
        data: payload,
      });
      expect(res.status(), `request ${i + 1} of 5 should succeed`).toBe(201);
    }

    const sixth = await request.post("/api/member-requests", {
      headers: { "x-forwarded-for": fakeIp },
      data: payload,
    });
    expect(sixth.status()).toBe(429);
    const body = await sixth.json();
    expect(body.error).toBe("rate_limited");
    expect(sixth.headers()["retry-after"]).toBeTruthy();
  });

  test("donation creation is rate-limited after 10 requests from the same IP within the window", async ({ request }) => {
    const fakeIp = `203.0.113.${Math.floor(Math.random() * 254) + 1}`;

    const purposesPage = await request.get("/donate");
    const html = await purposesPage.text();
    const match = html.match(/<option value="([0-9a-f-]{36})"/);
    if (!match) throw new Error("Could not find a donation purpose option on /donate");
    const purposeId = match[1];

    const payload = { donorName: "Rate Limit Test", mobile: "9812340098", amount: 100, purposeId, anonymous: false };

    for (let i = 0; i < 10; i++) {
      const res = await request.post("/api/donations", {
        headers: { "x-forwarded-for": fakeIp },
        data: payload,
      });
      expect(res.status(), `request ${i + 1} of 10 should succeed`).toBe(200);
    }

    const eleventh = await request.post("/api/donations", {
      headers: { "x-forwarded-for": fakeIp },
      data: payload,
    });
    expect(eleventh.status()).toBe(429);
    const body = await eleventh.json();
    expect(body.error).toBe("rate_limited");
  });

  test("different IPs are not affected by each other's rate limit", async ({ request }) => {
    const ipA = `203.0.113.${Math.floor(Math.random() * 100) + 1}`;
    const ipB = `203.0.113.${Math.floor(Math.random() * 100) + 150}`;
    const payload = {
      requestType: "registration",
      pangaliName: "IP Isolation Test",
      familyRepresentativeName: "IP Isolation Test",
      mobile: "9812340097",
      details: "Testing per-IP isolation.",
    };

    for (let i = 0; i < 5; i++) {
      const res = await request.post("/api/member-requests", { headers: { "x-forwarded-for": ipA }, data: payload });
      expect(res.status()).toBe(201);
    }
    const ipASixth = await request.post("/api/member-requests", { headers: { "x-forwarded-for": ipA }, data: payload });
    expect(ipASixth.status()).toBe(429);

    // A different IP should still succeed even though ipA is exhausted.
    const ipBFirst = await request.post("/api/member-requests", { headers: { "x-forwarded-for": ipB }, data: payload });
    expect(ipBFirst.status()).toBe(201);
  });
});
