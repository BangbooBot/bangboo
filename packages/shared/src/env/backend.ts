import { z } from "zod";
import { baseEnvSchema } from "./base.js";
import { parseEnv } from "./parse.js";

const DAY = 60 * 60 * 24;
const snowflake = z.string().regex(/^\d{17,20}$/, "must be a Discord snowflake id");

/** `a, b ,c` → `["a","b","c"]` */
const csv = z
  .string()
  .default("")
  .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean));

export const backendEnvSchema = baseEnvSchema
  .extend({
    BACKEND_PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    FRONTEND_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    BACKEND_URL: z.url().optional(),
    FRONTEND_URL: z.url().optional(),

    // --- Better Auth / Discord OAuth2 ---
    BETTER_AUTH_SECRET: z
      .string("BETTER_AUTH_SECRET is required")
      .min(32, "BETTER_AUTH_SECRET must have at least 32 characters"),
    DISCORD_CLIENT_ID: z.string("DISCORD_CLIENT_ID is required").min(1),
    DISCORD_CLIENT_SECRET: z.string("DISCORD_CLIENT_SECRET is required").min(1),
    /** Precisa ser IDÊNTICA à cadastrada no portal do Discord. Padrão: `${BACKEND_URL}/auth/callback`. */
    DISCORD_REDIRECT_URI: z.url().optional(),

    // --- Tokens (segundos) ---
    /** Vida do access token (JWT). Curto de propósito. */
    ACCESS_TOKEN_TTL: z.coerce.number().int().min(60).max(DAY).default(15 * 60),
    /** Vida do refresh token (sessão opaca no banco, renovada por uso). */
    REFRESH_TOKEN_TTL: z.coerce.number().int().min(300).max(365 * DAY).default(30 * DAY),

    // --- RBAC ---
    /** Discord IDs (separados por vírgula) que recebem o papel ROOT. */
    ROOT_DISCORD_IDS: csv.pipe(z.array(snowflake)),

    // --- Cookies / proxy ---
    COOKIE_DOMAIN: z.string().optional(),
    /** `true`, `false` ou nº de proxies confiáveis à frente do app. */
    TRUST_PROXY: z.string().optional(),
  })
  .transform((raw) => {
    const BACKEND_URL = (raw.BACKEND_URL ?? `http://localhost:${raw.BACKEND_PORT}`).replace(/\/+$/, "");
    const FRONTEND_URL = (raw.FRONTEND_URL ?? `http://localhost:${raw.FRONTEND_PORT}`).replace(/\/+$/, "");
    return {
      ...raw,
      BACKEND_URL,
      FRONTEND_URL,
      DISCORD_REDIRECT_URI: raw.DISCORD_REDIRECT_URI ?? `${BACKEND_URL}/auth/callback`,
      /** Cookies `Secure` sempre que a API é servida via HTTPS. */
      secureCookies: BACKEND_URL.startsWith("https://"),
      isProduction: raw.NODE_ENV === "production",
    };
  });

export type BackendEnv = z.output<typeof backendEnvSchema>;

export const backendEnv: BackendEnv = parseEnv(backendEnvSchema);
