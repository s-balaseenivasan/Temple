// SiteSettings is a singleton (FEAT-061) — this fixed id is the only row
// that should ever exist, enforced at the service layer (schema itself
// allows multiple rows, per DATA_MODEL.md's own note), matching the id the
// seed script upserts against.
export const SITE_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
