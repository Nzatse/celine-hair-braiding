import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const globalForPg = globalThis as unknown as { pgPool?: Pool };

function createPrismaClient() {
	const datasourceUrl = process.env.DATABASE_URL;

	// NOTE: Do not throw during module initialization. Next/Vercel may import API route modules at build
	// time (e.g. when collecting page data), and missing runtime env vars would fail the build.
	// If DATABASE_URL is missing, create a plain PrismaClient; DB operations will still fail at runtime
	// until DATABASE_URL is configured.
	if (!datasourceUrl) {
		return new PrismaClient();
	}

	const pool = globalForPg.pgPool ?? new Pool({ connectionString: datasourceUrl });
	if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

	const adapter = new PrismaPg(pool);
	return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
