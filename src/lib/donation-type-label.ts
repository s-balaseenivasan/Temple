// Display-only labels for DonationType — mirrors the wording already used
// in the offline-donation-form's own <select> options. Purely presentational:
// the underlying enum value (cash_online/cash_offline/in_kind_goods/
// in_kind_land) is never changed anywhere it's stored or queried.
const DONATION_TYPE_LABELS: Record<string, string> = {
  cash_online: "Cash (Online)",
  cash_offline: "Cash (Offline)",
  in_kind_goods: "In-kind: Goods",
  in_kind_land: "In-kind: Land",
};

export function donationTypeLabel(type: string): string {
  return DONATION_TYPE_LABELS[type] ?? type;
}
