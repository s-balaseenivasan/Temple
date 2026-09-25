export interface TimeRange {
  open: string;
  close: string;
}

export interface SpecialDayOverride extends TimeRange {
  date: string; // YYYY-MM-DD
  note_en?: string;
  note_ta?: string;
}

export interface TimingsJson {
  morning?: TimeRange;
  evening?: TimeRange;
  specialDayOverrides?: SpecialDayOverride[];
}

export interface ResolvedTimings {
  // Present only when no override is active for today — the standard
  // morning/evening sessions.
  standard: { morning: TimeRange; evening: TimeRange } | null;
  // Present only when an override matches today — a single replacement
  // window for the whole day (the override's own open/close pair, not a
  // second "evening" session), per FEAT-010/FEAT-062's data shape: one
  // {date, open, close} pair per override, not a morning/evening split.
  activeOverride: SpecialDayOverride | null;
}

// FEAT-010: "Special-day override takes precedence over standard timings
// when date matches" — resolves today's actual effective timings, given the
// raw JSON blob edited by FEAT-062. `today` is injectable for testing.
export function resolveTimings(timingsJson: unknown, today: Date = new Date()): ResolvedTimings {
  const data = (timingsJson ?? {}) as TimingsJson;
  const todayStr = today.toISOString().slice(0, 10);
  const activeOverride = (data.specialDayOverrides ?? []).find((o) => o.date === todayStr) ?? null;

  if (activeOverride) {
    return { standard: null, activeOverride };
  }

  if (!data.morning || !data.evening) {
    return { standard: null, activeOverride: null };
  }

  return { standard: { morning: data.morning, evening: data.evening }, activeOverride: null };
}
