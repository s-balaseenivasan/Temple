import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { login, SUPER_ADMIN } from "./helpers";

// FEAT-032: converts the manual verification of the committee reorder UI
// (added during the drag-and-drop-reorder backlog item) into a permanent
// regression test. Also covers the real bug found while building that UI:
// new committee members created without an explicit `displayOrder` all tied
// at the schema default of 0, which made the Up/Down buttons a no-op —
// fixed by defaulting the create form's field to the current member count.
test.describe("Committee member reorder (FEAT-032)", () => {
  const db = new Client({ connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable" });

  test.beforeAll(async () => {
    await db.connect();
  });

  test.afterAll(async () => {
    await db.end();
  });

  test("the create form defaults Display Order to the current member count, not 0", async ({ page }) => {
    const { rows: designations } = await db.query("SELECT id FROM designations LIMIT 1");
    const designationId = designations[0].id;
    const tag = Date.now();

    const seedRes = await db.query(
      'INSERT INTO committee_members (id, name_en, "designationId", mobile, status, "displayOrder", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, \'active\', 0, now(), now()) RETURNING id',
      [`Seed For Default Test ${tag}`, designationId, "9812340014"],
    );
    const seedId = seedRes.rows[0].id;

    try {
      await login(page, SUPER_ADMIN);
      await page.goto("/admin/committee/new");
      const value = await page.inputValue("#member-display-order");
      expect(Number(value)).toBeGreaterThanOrEqual(1); // at least the one seeded row above
    } finally {
      await db.query("DELETE FROM committee_members WHERE id = $1", [seedId]);
    }
  });

  test("clicking the Up arrow swaps a member's displayOrder with the one above it, both in the DB and on screen", async ({ page }) => {
    const { rows: designations } = await db.query("SELECT id FROM designations LIMIT 1");
    const designationId = designations[0].id;
    const tag = Date.now();
    const names = [`Reorder A ${tag}`, `Reorder B ${tag}`, `Reorder C ${tag}`];
    const ids: string[] = [];

    for (let i = 0; i < names.length; i++) {
      const r = await db.query(
        'INSERT INTO committee_members (id, name_en, "designationId", mobile, status, "displayOrder", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, \'active\', $4, now(), now()) RETURNING id',
        [names[i], designationId, "9812340015", i],
      );
      ids.push(r.rows[0].id);
    }

    try {
      await login(page, SUPER_ADMIN);
      await page.goto("/admin/committee");

      const rowsBefore = await page.locator("tbody tr").allInnerTexts();
      expect(rowsBefore[0]).toContain(names[0]);
      expect(rowsBefore[1]).toContain(names[1]);

      await page.getByLabel(`Move ${names[1]} up`).click();
      await page.waitForFunction(
        (expectedFirst) => document.querySelectorAll("tbody tr")[0]?.textContent?.includes(expectedFirst),
        names[1],
        { timeout: 5000 },
      );

      const rowsAfter = await page.locator("tbody tr").allInnerTexts();
      expect(rowsAfter[0]).toContain(names[1]);
      expect(rowsAfter[1]).toContain(names[0]);

      const { rows: dbOrder } = await db.query(
        'SELECT name_en, "displayOrder" FROM committee_members WHERE id = ANY($1) ORDER BY "displayOrder"',
        [ids],
      );
      expect(dbOrder[0].name_en).toBe(names[1]);
      expect(dbOrder[1].name_en).toBe(names[0]);
      expect(dbOrder[2].name_en).toBe(names[2]);
    } finally {
      await db.query("DELETE FROM committee_members WHERE id = ANY($1)", [ids]);
    }
  });
});
