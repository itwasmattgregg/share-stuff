import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  passwordResetToken: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  password: {
    upsert: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("~/db.server", () => ({
  prisma: prismaMock,
}));

vi.mock("~/models/email.server", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async (value: string) => `hashed:${value}`),
    compare: vi.fn(async (value: string, hash: string) => hash === `hashed:${value}`),
  },
}));

import { sendPasswordResetEmail } from "~/models/email.server";
import {
  changeUserPassword,
  getPasswordResetExpiryDate,
  isPasswordResetTokenValid,
  requestPasswordReset,
  validatePassword,
} from "./password.server";

describe("validatePassword", () => {
  it("requires at least 8 characters", () => {
    expect(validatePassword("short")).toBe("Password must be at least 8 characters");
    expect(validatePassword("longenough")).toBeNull();
  });
});

describe("password reset helpers", () => {
  it("expires reset tokens after one hour", () => {
    const now = new Date("2024-01-01T12:00:00");
    const expiresAt = getPasswordResetExpiryDate(now);
    expect(expiresAt.getTime() - now.getTime()).toBe(60 * 60 * 1000);
  });

  it("rejects expired reset tokens", () => {
    expect(
      isPasswordResetTokenValid({
        expiresAt: new Date(Date.now() - 1000),
      })
    ).toBe(false);
  });
});

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not reveal whether the email exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await requestPasswordReset({
      email: "missing@example.com",
      origin: "http://localhost:3000",
    });

    expect(result.sent).toBe(true);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("creates a reset token and sends email for existing users", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.passwordResetToken.create.mockResolvedValue({ token: "abc123" });

    await requestPasswordReset({
      email: "user@example.com",
      origin: "http://localhost:3000",
    });

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        resetUrl: expect.stringMatching(
          /^http:\/\/localhost:3000\/reset-password\/.+/
        ),
      })
    );
  });
});

describe("changeUserPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an incorrect current password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      password: { hash: "hashed:correct-password" },
    });

    await expect(
      changeUserPassword({
        userId: "user-1",
        currentPassword: "wrong-password",
        newPassword: "new-password",
      })
    ).rejects.toThrow("Current password is incorrect");
  });

  it("updates the password when the current password is correct", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      password: { hash: "hashed:old-password" },
    });

    await changeUserPassword({
      userId: "user-1",
      currentPassword: "old-password",
      newPassword: "new-password",
    });

    expect(prismaMock.password.update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { hash: "hashed:new-password" },
    });
  });
});
