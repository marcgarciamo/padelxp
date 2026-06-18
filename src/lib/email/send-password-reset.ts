export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === "development") {
    console.log(`🔐 Password reset link for ${email}: ${resetLink}`);
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return;
  }

  const emailHtml = `
    <h2>Recupera tu contraseña - PadelXP</h2>
    <p>Hola,</p>
    <p>Has solicitado recuperar tu contraseña en PadelXP.</p>
    <p><a href="${resetLink}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Cambiar contraseña</a></p>
    <p style="color: #666; font-size: 12px;">Este enlace es válido por 1 hora. Si no solicitaste esto, puedes ignorar este email.</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PadelXP <onboarding@resend.dev>",
        to: email,
        subject: "Recupera tu contraseña - PadelXP",
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      console.error("Resend error:", await response.text());
    }
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
}
