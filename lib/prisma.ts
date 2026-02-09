import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const globalForPg = globalThis as unknown as { pgPool?: Pool };

function createPrismaClient() {
	const datasourceUrl =
		process.env.DATABASE_URL ??
		process.env.POSTGRES_PRISMA_URL ??
		process.env.POSTGRES_URL;
	if (!datasourceUrl) {
		throw new Error("DATABASE_URL is not set");
	}

	const pool = globalForPg.pgPool ?? new Pool({ connectionString: datasourceUrl });
	if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

	const adapter = new PrismaPg(pool);
	return new PrismaClient({ adapter });
}

let prismaClient: PrismaClient | undefined = globalForPrisma.prisma;

function getPrismaClient(): PrismaClient {
	if (prismaClient) return prismaClient;

	// IMPORTANT: Lazy init so `next build` can import route modules (and this file)
	// without requiring runtime env vars.
	prismaClient = createPrismaClient();
	if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient;
	return prismaClient;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
	get(_target, prop) {
		const client = getPrismaClient();
		const value = (client as unknown as Record<PropertyKey, unknown>)[prop];
		return typeof value === "function" ? value.bind(client) : value;
	},
});
