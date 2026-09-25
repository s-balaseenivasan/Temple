import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EmailProvider, SendEmailParams } from "./types";

// Default provider — no SMTP configuration required, so FEAT-071 (and
// anything else that sends email later) works out of the box in local dev
// and in this sandbox, the same way PAYMENT_PROVIDER=mock does for
// donations. Every "sent" email is logged to the console AND written to
// .data/emails/ (already gitignored, same directory family as the local
// receipt-PDF fallback storage) so a real end-to-end test can read back
// the actual reset link/token, not just assert that a function was called.
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console" as const;

  async sendEmail(params: SendEmailParams): Promise<void> {
    // Security review: in production the console provider only ever means
    // "email isn't configured". Writing the message to disk there would
    // persist live password-reset tokens on the server, so it is suppressed
    // (and logged loudly) instead. The caller still returns its normal
    // generic response, so this doesn't leak which accounts exist.
    if (process.env.NODE_ENV === "production") {
      console.error(`[email:console] EMAIL_PROVIDER is not configured — email to ${params.to} ("${params.subject}") was NOT sent.`);
      return;
    }

    console.log(`[email:console] To: ${params.to} | Subject: ${params.subject}`);

    const dir = path.join(process.cwd(), ".data", "emails");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${Date.now()}-${params.to.replace(/[^a-z0-9@.]/gi, "_")}.json`);
    await writeFile(file, JSON.stringify(params, null, 2), "utf-8");
  }
}
