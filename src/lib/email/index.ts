import type { EmailProvider } from "./types";
import { ConsoleEmailProvider } from "./console-provider";
import { SmtpEmailProvider } from "./smtp-provider";

let cached: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cached) return cached;
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  cached = provider === "smtp" ? new SmtpEmailProvider() : new ConsoleEmailProvider();
  return cached;
}

export type { EmailProvider, SendEmailParams } from "./types";
