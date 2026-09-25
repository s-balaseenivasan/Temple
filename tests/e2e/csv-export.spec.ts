import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { login, SUPER_ADMIN } from "./helpers";

// FEAT-058: converts the manual verification of the CSV report export into a
// permanent regression test — the same class of check that caught the
// receipt-PDF content-disposition bug earlier in this project (a real
// browser download event, not just an HTTP 200), plus a deterministic
// arithmetic check on the downloaded file's actual content, matching how
// FEAT-054 (Daily report) was verified. Uses a fixed historical month
// (July 2013) that no other spec touches, so the total is exactly checkable.
test("CSV export downloads a real file with the correct, exact totals", async ({ page }) => {
  const db = new Client({ connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable" });
  await db.connect();

  const { rows: purposes } = await db.query("SELECT id FROM donation_purposes LIMIT 1");
  const purposeId = purposes[0].id;
  const tag = Date.now();

  const d1 = await db.query(
    `INSERT INTO donations (id, "donorName", mobile, amount, "purposeId", anonymous, status, "donationType", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, 321.00, $3, false, 'success', 'cash_offline', '2013-07-15T10:00:00Z', now()) RETURNING id`,
    [`CSV Test A ${tag}`, "9812340040", purposeId],
  );
  const d2 = await db.query(
    `INSERT INTO donations (id, "donorName", mobile, amount, "purposeId", anonymous, status, "donationType", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, 179.00, $3, false, 'success', 'cash_offline', '2013-07-20T10:00:00Z', now()) RETURNING id`,
    [`CSV Test B ${tag}`, "9812340041", purposeId],
  );
  const donationIds = [d1.rows[0].id, d2.rows[0].id];

  try {
    await login(page, SUPER_ADMIN);
    await page.goto("/admin/reports?granularity=monthly&month=7&year=2013");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('a:has-text("Export Excel (CSV)")'),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);

    // download.createReadStream() was found to race the completed download
    // write and yield an empty read under Playwright/msedge here. Reading or
    // copying the artifact file directly can also hit a transient EPERM,
    // because this project directory lives under OneDrive, which briefly
    // holds an exclusive lock on newly written files for cloud sync — retry
    // saveAs() a few times before failing.
    const tmpDir = await mkdtemp(path.join(tmpdir(), "csv-export-test-"));
    const savedPath = path.join(tmpDir, "report.csv");
    let lastErr: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await download.saveAs(savedPath);
        lastErr = undefined;
        break;
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    if (lastErr) throw lastErr;
    const csvText = await readFile(savedPath, "utf-8");
    await rm(tmpDir, { recursive: true, force: true });

    const lines = csvText.split("\r\n").filter(Boolean);
    const grandTotalLine = lines.find((l) => l.startsWith('"Grand Total"'));
    expect(grandTotalLine).toBeTruthy();
    // 321.00 + 179.00 = 500.00 exactly — deterministic, not "some non-zero number".
    expect(grandTotalLine).toContain(",2,500.00");

    const dataRow = lines.find((l) => l.includes("cash_offline"));
    expect(dataRow).toContain(",2,500.00");
  } finally {
    await db.query("DELETE FROM donations WHERE id = ANY($1)", [donationIds]);
    await db.end();
  }
});
