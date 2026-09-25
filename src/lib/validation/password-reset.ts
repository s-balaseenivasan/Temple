import { z } from "zod";

// FEAT-071: public-facing (an admin who is currently locked out of their own
// account, by definition not authenticated) — messages are bilingual keys
// into messages.ts, same convention as the other public forms.
export const forgotPasswordSchema = z.object({
  email: z.string().email("invalid_email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "reset_token_required"),
  newPassword: z.string().min(8, "password_min_length"),
});
