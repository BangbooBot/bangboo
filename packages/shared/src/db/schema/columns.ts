import { timestamp } from "drizzle-orm/pg-core";

/** `timestamptz` — sempre armazenar instantes com fuso, nunca `timestamp` "ingênuo". */
export const tstz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
