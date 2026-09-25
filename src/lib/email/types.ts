/**
 * Gateway-agnostic email adapter — same pattern as src/lib/payment/types.ts
 * for the same reason: which email provider/SMTP relay this deployment uses
 * is a hosting decision, not something to hard-code into FEAT-071's logic.
 * Every caller is written against this interface, never against a specific
 * provider's SDK/field names.
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  readonly name: "console" | "smtp";
  sendEmail(params: SendEmailParams): Promise<void>;
}
