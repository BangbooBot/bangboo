import { z } from "zod";

/** Variáveis comuns a TODOS os processos (bot e backend). */
export const baseEnvSchema = z.looseObject({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .url({ protocol: /^postgres(ql)?$/, error: "DATABASE_URL must be a postgres:// connection string" }),
  GUILD_ID: z.string().optional(),
  WEBHOOK_LOGS_URL: z.url().optional(),
});

export type BaseEnv = z.output<typeof baseEnvSchema>;
