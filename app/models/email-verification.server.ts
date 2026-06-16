import { randomBytes } from "node:crypto";

import { sendEmailVerificationEmail } from "~/models/email.server";
import { prisma } from "~/db.server";

const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function createVerificationToken() {
  return randomBytes(32).toString("base64url");
}

export function getEmailVerificationExpiryDate(from = new Date()) {
  return new Date(from.getTime() + VERIFICATION_TOKEN_EXPIRY_MS);
}

export function isEmailVerificationTokenValid(token: { expiresAt: Date }) {
  return token.expiresAt.getTime() > Date.now();
}

export async function sendEmailVerification({
  userId,
  origin,
}: {
  userId: string;
  origin: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerifiedAt: true },
  });

  if (!user || user.emailVerifiedAt) {
    return;
  }

  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });

  const token = createVerificationToken();
  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: getEmailVerificationExpiryDate(),
    },
  });

  const verifyUrl = `${origin}/verify-email/${token}`;
  await sendEmailVerificationEmail({
    to: user.email,
    verifyUrl,
  });
}

export async function requestEmailVerification({
  email,
  origin,
}: {
  email: string;
  origin: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user || user.emailVerifiedAt) {
    return { sent: true };
  }

  await sendEmailVerification({ userId: user.id, origin });
  return { sent: true };
}

export async function getEmailVerificationToken({ token }: { token: string }) {
  return prisma.emailVerificationToken.findUnique({
    where: { token },
    include: {
      user: {
        select: { id: true, email: true, emailVerifiedAt: true },
      },
    },
  });
}

export async function verifyEmailWithToken({ token }: { token: string }) {
  const verificationToken = await getEmailVerificationToken({ token });

  if (!verificationToken || !isEmailVerificationTokenValid(verificationToken)) {
    throw new Error("Invalid or expired verification link");
  }

  if (verificationToken.user.emailVerifiedAt) {
    return verificationToken.user;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: verificationToken.userId },
    }),
  ]);

  return verificationToken.user;
}
