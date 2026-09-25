import nodemailer from "nodemailer";
import type { EmailProvider, SendEmailParams } from "./types";

// Reference implementation for a real deployment — same role as
// razorpay-provider.ts for payments: works against any standard SMTP relay
// (a temple-specific Gmail/Zoho/Office365 account, SendGrid's SMTP
// interface, Amazon SES SMTP, etc.), not tied to one vendor's proprietary
// API, since which one this deployment actually uses is a hosting decision
// left open (same category as CR-001).
export class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp" as const;

  private transporter: ReturnType<typeof nodemailer.createTransport>;
  private from: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.from = process.env.SMTP_FROM || "no-reply@example.com";

    if (!host || !port || !user || !pass) {
      throw new Error(
        "SmtpEmailProvider requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to be set — see .env.example.",
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });
  }

  async sendEmail(params: SendEmailParams): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  }
}
