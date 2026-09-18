import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create Default Academic Institution
  const institution = await prisma.institution.upsert({
    where: { code: "UTF-01" },
    update: {},
    create: {
      name: "Universidade Tecnológica Federal",
      code: "UTF-01",
      relayerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat Account #0
    },
  });
  console.log(`✅ Institution created/verified: ${institution.name} (${institution.code})`);

  // 2. Create Admin User
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@universidade.edu.br" },
    update: {},
    create: {
      email: "admin@universidade.edu.br",
      passwordHash: adminPasswordHash,
      name: "Administrador do Sistema",
      role: Role.ADMIN,
      institutionId: institution.id,
    },
  });
  console.log(`✅ Admin User created: ${admin.email} (Role: ADMIN)`);

  // 3. Create Staff / Issuer User
  const staffPasswordHash = await bcrypt.hash("Secretaria@123456", 10);
  const staff = await prisma.user.upsert({
    where: { email: "secretaria@universidade.edu.br" },
    update: {},
    create: {
      email: "secretaria@universidade.edu.br",
      passwordHash: staffPasswordHash,
      name: "Secretaria Acadêmica",
      role: Role.ISSUER,
      institutionId: institution.id,
    },
  });
  console.log(`✅ Staff User created: ${staff.email} (Role: ISSUER)`);

  console.log("----------------------------------------------------");
  console.log("🎉 Seed finished successfully!");
  console.log("Credentials for login:");
  console.log("  Staff:  secretaria@universidade.edu.br / Secretaria@123456");
  console.log("  Admin:  admin@universidade.edu.br / Admin@123456");
  console.log("----------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
