// ---------------------------------------------------------------------------
// Prisma client (single shared instance)
// ---------------------------------------------------------------------------
// Prisma 7 no longer ships a query-engine binary; it uses a "driver adapter"
// on top of a real Node Postgres driver (`pg`). We create ONE client and reuse
// it. In development Next.js hot-reloads modules, which would otherwise open a
// new DB connection pool on every save — so we cache the client on globalThis.
// ---------------------------------------------------------------------------

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
