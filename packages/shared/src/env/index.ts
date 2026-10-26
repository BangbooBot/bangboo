import { baseEnvSchema } from "./base.js";
import { parseEnv } from "./parse.js";

export * from "./base.js";
export * from "./parse.js";

/** Env mínimo compartilhado (DATABASE_URL, NODE_ENV...). Usado pelo cliente do banco. */
export const env = parseEnv(baseEnvSchema);
