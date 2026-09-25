import { describe, it, expect } from "vitest";
import { donationFormSchema, receiptLookupSchema, offlineDonationSchema } from "./donation";

describe("donationFormSchema (RULE-002/003/005/006)", () => {
  const valid = {
    donorName: "Ramesh Kumar",
    mobile: "9876543210",
    amount: 501,
    purposeId: "123e4567-e89b-12d3-a456-426614174000",
  };

  it("accepts a minimal valid donation", () => {
    expect(donationFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an amount below the RULE-002 minimum (₹10)", () => {
    const result = donationFormSchema.safeParse({ ...valid, amount: 5 });
    expect(result.success).toBe(false);
  });

  it("rejects an amount above the RULE-003 maximum (₹5,00,000)", () => {
    const result = donationFormSchema.safeParse({ ...valid, amount: 600000 });
    expect(result.success).toBe(false);
  });

  it("rejects a mobile number that isn't a valid 10-digit Indian number (RULE-005)", () => {
    expect(donationFormSchema.safeParse({ ...valid, mobile: "12345" }).success).toBe(false);
    expect(donationFormSchema.safeParse({ ...valid, mobile: "5876543210" }).success).toBe(false); // must start 6-9
  });

  it("accepts a valid PAN format and rejects an invalid one (RULE-006)", () => {
    expect(donationFormSchema.safeParse({ ...valid, pan: "ABCDE1234F" }).success).toBe(true);
    expect(donationFormSchema.safeParse({ ...valid, pan: "invalid-pan" }).success).toBe(false);
  });

  it("treats PAN as optional", () => {
    expect(donationFormSchema.safeParse({ ...valid, pan: "" }).success).toBe(true);
  });
});

describe("receiptLookupSchema (RULE-016 compound-key lookup)", () => {
  it("requires both mobile and receiptNumber", () => {
    expect(receiptLookupSchema.safeParse({ mobile: "9876543210", receiptNumber: "DON-2026-000001" }).success).toBe(true);
    expect(receiptLookupSchema.safeParse({ mobile: "9876543210" }).success).toBe(false);
    expect(receiptLookupSchema.safeParse({ receiptNumber: "DON-2026-000001" }).success).toBe(false);
  });
});

describe("offlineDonationSchema (RULE-042 in-kind valuation requirement)", () => {
  const base = {
    donorName: "Community Elder",
    mobile: "9876543210",
    amount: 1000,
    purposeId: "123e4567-e89b-12d3-a456-426614174000",
  };

  it("accepts cash_offline without a valuation note", () => {
    expect(offlineDonationSchema.safeParse({ ...base, donationType: "cash_offline" }).success).toBe(true);
  });

  it("REJECTS in_kind_goods without a valuation note (RULE-042)", () => {
    const result = offlineDonationSchema.safeParse({ ...base, donationType: "in_kind_goods" });
    expect(result.success).toBe(false);
  });

  it("accepts in_kind_land WITH a valuation note", () => {
    const result = offlineDonationSchema.safeParse({ ...base, donationType: "in_kind_land", valuationNote: "2 acres, estimated at market rate" });
    expect(result.success).toBe(true);
  });
});
