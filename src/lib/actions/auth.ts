"use server";

import { db } from "@db/index";
import { passwordResetTokens } from "@db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { sendPasswordResetEmail } from "@lib/email/send-password-reset";
import { hashPassword } from "better-auth/crypto";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").max(255),
});

export async function sendPasswordReset(input: z.infer<typeof ForgotPasswordSchema>) {
  const parsed = ForgotPasswordSchema.safeParse(input);
  if (!parsed.success) throw new Error("Email inválido");

  const email = parsed.data.email.toLowerCase();

  try {
    const user = await db.execute(sql`SELECT id FROM "user" WHERE email = ${email} LIMIT 1`);
    if (!user || user.length === 0) {
      return { ok: true };
    }

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));

    const token = crypto.getRandomValues(new Uint8Array(32));
    const tokenStr = Array.from(token).map(b => b.toString(16).padStart(2, "0")).join("");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      email,
      token: tokenStr,
      expiresAt,
    });

    await sendPasswordResetEmail(email, tokenStr);
    return { ok: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { ok: true };
  }
}

export async function validateResetToken(token: string): Promise<boolean> {
  if (!token || token.length !== 64) return false;

  try {
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, token),
    });

    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

const ResetPasswordSchema = z.object({
  token:            z.string().min(64).max(64),
  newPassword:      z.string().min(8).max(128),
  confirmPassword:  z.string().min(8).max(128),
});

export async function resetPassword(input: z.infer<typeof ResetPasswordSchema>) {
  const parsed = ResetPasswordSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const { token, newPassword, confirmPassword } = parsed.data;

  if (newPassword !== confirmPassword) {
    throw new Error("Las contraseñas no coinciden");
  }

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token),
  });

  if (!resetToken) throw new Error("Enlace inválido o expirado");
  if (resetToken.used) throw new Error("Este enlace ya fue utilizado");
  if (new Date() > resetToken.expiresAt) throw new Error("Enlace expirado");

  try {
    const user = await db.execute(sql`SELECT id FROM "user" WHERE email = ${resetToken.email} LIMIT 1`);
    if (!user || user.length === 0) throw new Error("Usuario no encontrado");

    const hashedPassword = await hashPassword(newPassword);

    await db.execute(sql`UPDATE "user" SET password = ${hashedPassword} WHERE email = ${resetToken.email}`);

    await db.update(passwordResetTokens).set({
      used: true,
    }).where(eq(passwordResetTokens.token, token));

    return { ok: true };
  } catch (error) {
    console.error("Reset password error:", error);
    throw new Error("Error al cambiar contraseña");
  }
}
