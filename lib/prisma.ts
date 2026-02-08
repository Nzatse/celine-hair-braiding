import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const globalForPg = globalThis as unknown as { pgPool?: Pool };

function createPrismaClient() {
	const datasourceUrl = process.env.DATABASE_URL;
	if (!datasourceUrl) {
		throw new Error("DATABASE_URL is not set");
	}

	const pool = globalForPg.pgPool ?? new Pool({ connectionString: datasourceUrl });
	if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

	const adapter = new PrismaPg(pool);
	return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
