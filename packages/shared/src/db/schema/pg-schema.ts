import { pgSchema } from "drizzle-orm/pg-core";

/** Todas as tabelas da aplicação vivem neste schema do Postgres. */
export const dbSchema = pgSchema("bangboo-schema");
