import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

// `generate` só compara schema x snapshots e não precisa de conexão.
const needsConnection = !process.argv.includes("generate");
if (!url && needsConnection) {
  throw new Error("DATABASE_URL is required (use `bun run db:*`, which loads .env)");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*.ts",
  out: "./drizzle",
  schemaFilter: ["bangboo-schema"],
  dbCredentials: { url: url ?? "postgres://unused" },
  strict: true,
  verbose: true,
});
