import { describe, it, expect } from "vitest";
import { localizeMessage, localizeFieldErrors } from "./messages";
import { donationFormSchema } from "./donation";

describe("localizeMessage", () => {
  it("returns the Tamil and English text for a known key", () => {
    expect(localizeMessage("invalid_mobile", "en")).toBe("Enter a valid 10-digit Indian mobile number");
    expect(localizeMessage("invalid_mobile", "ta")).toBe("சரியான 10 இலக்க இந்திய கைபேசி எண்ணை உள்ளிடவும்");
  });

  it("falls back to a generic locale-appropriate message for an unknown key", () => {
    expect(localizeMessage("some_key_never_defined", "en")).toMatch(/check this field/i);
    expect(localizeMessage("some_key_never_defined", "ta")).toMatch(/சரிபார்/);
  });
});

describe("localizeFieldErrors", () => {
  it("translates every key in every field's error array to the requested locale", () => {
    const flat = donationFormSchema.safeParse({
      donorName: "A",
      mobile: "123",
      amount: 1,
      purposeId: "not-a-uuid",
    }).error!.flatten();

    const ta = localizeFieldErrors(flat.fieldErrors, "ta");
    expect(ta.mobile[0]).toBe("சரியான 10 இலக்க இந்திய கைபேசி எண்ணை உள்ளிடவும்");
    expect(ta.amount[0]).toBe("குறைந்தபட்ச நன்கொடைத் தொகை ₹10");
    expect(ta.purposeId[0]).toBe("நன்கொடையின் நோக்கத்தைத் தேர்ந்தெடுக்கவும்");

    const en = localizeFieldErrors(flat.fieldErrors, "en");
    expect(en.mobile[0]).toBe("Enter a valid 10-digit Indian mobile number");
  });
});
