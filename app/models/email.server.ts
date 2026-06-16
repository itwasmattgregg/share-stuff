import nodemailer from "nodemailer";

type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function getSmtpConfig() {
  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    return {
      host: "smtp.resend.com",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      user: "resend",
      pass: resendApiKey,
    };
  }

  return null;
}

function getTransport() {
  const config = getSmtpConfig();

  if (!config) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth:
      config.user && config.pass
        ? {
            user: config.user,
            pass: config.pass,
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

export async function sendEmailVerificationEmail({
  to,
  verifyUrl,
}: {
  to: string;
  verifyUrl: string;
}) {
  const subject = "Verify your ShareStuff email address";
  const text = `Verify your ShareStuff email address using this link (expires in 24 hours):\n\n${verifyUrl}\n\nIf you did not create an account, you can ignore this email.`;
  const html = `
    <p>Verify your ShareStuff email address using the link below. This link expires in 24 hours.</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>If you did not create an account, you can ignore this email.</p>
  `;

  await sendEmail({ to, subject, text, html });
}
