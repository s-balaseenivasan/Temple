import { config } from "dotenv";
import path from "node:path";

// Vitest doesn't auto-load .env into process.env the way Next.js does — only
// src/lib/reports.test.ts needs this (it's the one test file that talks to
// the real local database), but loading it globally is harmless for the
// pure-logic test files.
config({ path: path.resolve(import.meta.dirname, ".env") });
