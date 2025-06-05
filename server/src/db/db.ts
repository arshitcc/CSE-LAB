import { PrismaClient } from "../generated/prisma";
import logger from "../loggers/winston.logger";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export async function connectDB() {
  try {
    await db.$connect();

    let host = "unknown";
    if (process.env.DB_URL) {
      const url = new URL(process.env.DB_URL);
      host = url.host;
    }

    if(host === "unknown") {
      throw new Error("DB_URL is not set");
    }

    logger.info(`\n☘️  Prisma connected! DB host: ${host}\n`);
  } catch (error) {
    logger.error("Prisma Connection Error:", error);
    process.exit(1);
  }
}
