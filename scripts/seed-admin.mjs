import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

try {
  const email = "allpropertylink1@gmail.com";
  const password = "4300@Dell";
  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashed,
      role: "ADMIN",
      accountStatus: "ACTIVE",
    },
    create: {
      email,
      passwordHash: hashed,
      role: "ADMIN",
      accountStatus: "ACTIVE",
      firstName: "Admin",
      lastName: "User",
    },
  });

  console.log("Admin user ready:", user.email, "| Role:", user.role);
} finally {
  await prisma.$disconnect();
}
