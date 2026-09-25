// Quick-pick amounts shown in the floating donate modal. This is a
// frontend-only UI convenience, not a backend-enforced business rule — no
// preset/suggested amounts exist anywhere in the schema or API. The actual
// minimum (₹10) and all real validation live solely in the existing
// POST /api/donations route; this list only saves a typing step before the
// user reaches the existing donation form.
export const QUICK_DONATION_AMOUNTS = [500, 1000, 2000, 5000] as const;
