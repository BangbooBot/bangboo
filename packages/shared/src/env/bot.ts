import { z } from "zod";
import { baseEnvSchema } from "./base.js";
import { parseEnv } from "./parse.js";

/** O bot NÃO recebe segredos de OAuth/JWT (menor privilégio). */
export const botEnvSchema = baseEnvSchema.extend({
  BOT_TOKEN: z.string("BOT_TOKEN is required").min(1, "BOT_TOKEN is required"),
});

export type BotEnv = z.output<typeof botEnvSchema>;

export const botEnv: BotEnv = parseEnv(botEnvSchema);
