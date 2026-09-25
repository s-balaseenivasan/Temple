import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// `prisma dev`'s embedded local Postgres was found (via repeated real-browser
// verification, not guessed) to be unreliable under even 2 truly-concurrent
// connections from this adapter's pool — not just under heavy load — causing
// intermittent "ConnectionClosed"/"Connection terminated unexpectedly"
// errors on ordinary `Promise.all([...prisma queries])` calls throughout the
// app. Capping the pool at a single connection forces every query to
// serialize through one connection, which has been reliable in testing.
// This is a **local-dev-only workaround** for this specific embedded
// database's limitation — a real managed Postgres in production has no such
// ceiling and should not be capped this way; see IMPLEMENTATION_ENVIRONMENT.md.
const isLocalPrismaDev = (process.env.DATABASE_URL ?? "").includes("localhost:51214");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  keepAlive: true,
  max: isLocalPrismaDev ? 1 : 10,
  // Local dev only: never let the single pooled connection go idle and get
  // torn down/reconnected mid-session — one more defensive measure against
  // this embedded database's known flakiness (see the note above and
  // IMPLEMENTATION_ENVIRONMENT.md for the full recurring-instability history).
  idleTimeoutMillis: isLocalPrismaDev ? 0 : 30000,
  connectionTimeoutMillis: 10000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
