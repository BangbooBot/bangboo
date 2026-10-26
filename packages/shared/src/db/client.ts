import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env/index.js";
import * as schema from "./schema/index.js";

/** Conexão única por processo. O `postgres` conecta de forma preguiçosa (na 1ª query). */
export const sqlClient = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === "production" ? 10 : 5,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle({ client: sqlClient, schema });

export type Database = typeof db;

/** Encerra o pool (shutdown gracioso / testes). */
export async function closeDb(): Promise<void> {
  await sqlClient.end({ timeout: 5 });
}
