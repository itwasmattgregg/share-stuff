import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  emailVerificationToken: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("~/db.server", () => ({
  prisma: prismaMock,
}));

vi.mock("~/models/email.server", () => ({
  sendEmailVerificationEmail: vi.fn(),
}));

import { sendEmailVerificationEmail } from "~/models/email.server";
import {
  getEmailVerificationExpiryDate,
  isEmailVerificationTokenValid,
  requestEmailVerification,
  sendEmailVerification,
} from "./email-verification.server";

describe("email verification helpers", () => {
  it("expires verification tokens after 24 hours", () => {
    const now = new Date("2024-01-01T12:00:00");
    const expiresAt = getEmailVerificationExpiryDate(now);
    expect(expiresAt.getTime() - now.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("rejects expired verification tokens", () => {
    expect(
      isEmailVerificationTokenValid({
        expiresAt: new Date(Date.now() - 1000),
      })
    ).toBe(false);
  });
});

describe("requestEmailVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not reveal whether the email exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await requestEmailVerification({
      email: "missing@example.com",
      origin: "http://localhost:3000",
    });

    expect(result.sent).toBe(true);
    expect(sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it("does not send email for already verified users", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      emailVerifiedAt: new Date(),
    });

    const result = await requestEmailVerification({
      email: "user@example.com",
      origin: "http://localhost:3000",
    });

    expect(result.sent).toBe(true);
    expect(sendEmailVerificationEmail).not.toHaveBeenCalled();
  });
});

describe("sendEmailVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a verification token and sends email", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      emailVerifiedAt: null,
    });
    prismaMock.emailVerificationToken.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.emailVerificationToken.create.mockResolvedValue({ token: "abc123" });

    await sendEmailVerification({
      userId: "user-1",
      origin: "http://localhost:3000",
    });

    expect(sendEmailVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        verifyUrl: expect.stringMatching(
          /^http:\/\/localhost:3000\/verify-email\/.+/
        ),
      })
    );
  });
});
