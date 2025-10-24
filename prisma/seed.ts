import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "rachel@remix.run";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("racheliscool", 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  // Create a sample community
  const community = await prisma.community.create({
    data: {
      name: "Sample Community",
      description: "A sample community for testing",
      rules: "Be kind and respectful to all members",
      ownerId: user.id,
    },
  });

  // Create a sample item
  await prisma.item.create({
    data: {
      name: "Sample Book",
      description: "A great book to share",
      category: "book",
      condition: "excellent",
      ownerId: user.id,
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
