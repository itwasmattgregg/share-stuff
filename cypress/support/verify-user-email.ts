// Marks a test user's email as verified.
// npx ts-node --require tsconfig-paths/register ./cypress/support/verify-user-email.ts username@example.com

import { installGlobals } from "@remix-run/node";

import { prisma } from "~/db.server";

installGlobals();

async function verifyUserEmail(email: string) {
  if (!email) {
    throw new Error("email required");
  }
  if (!email.endsWith("@example.com")) {
    throw new Error("All test emails must end in @example.com");
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerifiedAt: new Date() },
  });
}

verifyUserEmail(process.argv[2])
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
