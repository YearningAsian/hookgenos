import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM || 'HookGenOS <noreply@hookgenos.io>';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  if (!resend) {
    // Dev fallback: log the link so developers can test without a real key.
    console.log(`[email] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your HookGenOS password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#09090b">Reset your password</h2>
        <p>You requested a password reset for your HookGenOS account.</p>
        <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
          Reset password
        </a>
        <p style="color:#71717a;font-size:14px">
          If you didn't request this, you can safely ignore this email.
          Your password won't change until you click the link above.
        </p>
        <p style="color:#71717a;font-size:12px">
          Or copy this URL into your browser:<br>
          <a href="${resetUrl}" style="color:#7c3aed">${resetUrl}</a>
        </p>
      </div>
    `,
  });
}
