// ---------------------------------------------------------------------------
// Seed — creates the first ADMIN user (idempotent)
// ---------------------------------------------------------------------------
// Run with:  npm run db:seed
// Requires DATABASE_URL to be set in .env.
// ---------------------------------------------------------------------------

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "tumainminja888@gmail.com";
const ADMIN_NAME = "MINJA";
const ADMIN_PASSWORD = "KleanAll@2026"; // change this after first login!

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`✔ Admin already exists: ${ADMIN_EMAIL}`);
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: { email: ADMIN_EMAIL, name: ADMIN_NAME, role: "ADMIN", passwordHash, isActive: true },
  });
  console.log(`✔ Seeded ADMIN: ${ADMIN_EMAIL}  (password: ${ADMIN_PASSWORD} — change it!)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
