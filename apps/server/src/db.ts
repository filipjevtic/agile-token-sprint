import { PrismaClient } from "@prisma/client";
import { config } from "./config.js";

let prisma: PrismaClient | null = null;

export async function getPrisma(): Promise<PrismaClient> {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: { db: { url: config.databaseUrl } },
    });
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
