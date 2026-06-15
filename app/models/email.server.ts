import nodemailer from "nodemailer";

type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function getTransport() {
  const host = process.env.SMTP_HOST;

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

export async function sendEmail({ to, subject, text, html }: SendEmailArgs) {
  const from = process.env.EMAIL_FROM ?? "ShareStuff <noreply@sharestuff.local>";
  const transport = getTransport();

  if (!transport) {
    console.info(`[email] To: ${to}\nSubject: ${subject}\n${text}`);
    return;
  }

  await transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  const subject = "Reset your ShareStuff password";
  const text = `Reset your ShareStuff password using this link (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <p>Reset your ShareStuff password using the link below. This link expires in 1 hour.</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  await sendEmail({ to, subject, text, html });
}
