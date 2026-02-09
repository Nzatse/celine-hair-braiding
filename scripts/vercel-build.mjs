import { execSync } from "node:child_process";

function hasDbUrl() {
  return Boolean(
    process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL,
  );
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

const vercelEnv = process.env.VERCEL_ENV;
const shouldMigrate = vercelEnv === "production";

if (shouldMigrate) {
  if (!hasDbUrl()) {
    console.warn(
      "Skipping prisma migrate deploy: no DATABASE_URL/POSTGRES_URL/POSTGRES_PRISMA_URL set.",
    );
  } else {
    console.log("Running prisma migrate deploy...");
    run("npx prisma migrate deploy");
  }
} else {
  console.log(`Skipping prisma migrate deploy for VERCEL_ENV=${vercelEnv ?? "(unset)"}`);
}

console.log("Running next build...");
run("npx next build");
