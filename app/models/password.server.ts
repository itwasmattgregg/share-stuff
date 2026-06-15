import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

import { sendPasswordResetEmail } from "~/models/email.server";
import { prisma } from "~/db.server";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return "Password must be at least 8 characters";
  }

  return null;
}

function createResetToken() {
  return randomBytes(32).toString("base64url");
}

export function getPasswordResetExpiryDate(from = new Date()) {
  return new Date(from.getTime() + RESET_TOKEN_EXPIRY_MS);
}

export function isPasswordResetTokenValid(token: { expiresAt: Date }) {
  return token.expiresAt.getTime() > Date.now();
}

export async function requestPasswordReset({
  email,
  origin,
}: {
  email: string;
  origin: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    return { sent: true };
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const token = createResetToken();
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: getPasswordResetExpiryDate(),
    },
  });

  const resetUrl = `${origin}/reset-password/${token}`;
  await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
  });

  return { sent: true };
}

export async function getPasswordResetToken({ token }: { token: string }) {
  return prisma.passwordResetToken.findUnique({
    where: { token },
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });
}

export async function resetPasswordWithToken({
  token,
  password,
}: {
  token: string;
  password: string;
}) {
  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const resetToken = await getPasswordResetToken({ token });

  if (!resetToken || !isPasswordResetTokenValid(resetToken)) {
    throw new Error("Invalid or expired reset link");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.password.upsert({
      where: { userId: resetToken.userId },
      update: { hash: hashedPassword },
      create: {
        userId: resetToken.userId,
        hash: hashedPassword,
      },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  return resetToken.user;
}

export async function changeUserPassword({
  userId,
  currentPassword,
  newPassword,
}: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const userWithPassword = await prisma.user.findUnique({
    where: { id: userId },
    include: { password: true },
  });

  if (!userWithPassword?.password) {
    throw new Error("Password not set for this account");
  }

  const isValid = await bcrypt.compare(
    currentPassword,
    userWithPassword.password.hash
  );

  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.password.update({
    where: { userId },
    data: { hash: hashedPassword },
  });
}
