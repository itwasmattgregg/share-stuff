#!/usr/bin/env node
// Compiled version of make-admin.ts for production use
// This can be run directly with Node.js on Fly.io

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide an email address");
    console.log(
      "Usage: node scripts/make-admin.js your-email@example.com"
    );
    process.exit(1);
  }

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      console.log("Make sure the user has registered first");
      process.exit(1);
    }

    // Update the user to be a SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: "SUPER_ADMIN" },
    });

    console.log("✅ Successfully made user an admin!");
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`👤 Name: ${updatedUser.name || "Not set"}`);
    console.log(`🔑 Role: ${updatedUser.role}`);
    console.log(`🆔 ID: ${updatedUser.id}`);
  } catch (error) {
    console.error("❌ Error making user admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
