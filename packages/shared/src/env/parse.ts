import type { z } from "zod";

export class EnvValidationError extends Error {
  constructor(public readonly issues: readonly string[]) {
    super(`Invalid environment variables:\n${issues.join("\n")}`);
    this.name = "EnvValidationError";
  }
}

/**
 * Valida variáveis de ambiente de forma SÍNCRONA (sem top-level await).
 * Strings vazias (`FOO=` no .env) são tratadas como "não definida".
 */
export function parseEnv<S extends z.ZodType>(
  schema: S,
  source: Record<string, string | undefined> = process.env,
): z.output<S> {
  const cleaned: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(source)) {
    cleaned[key] = value === "" ? undefined : value;
  }

  const result = schema.safeParse(cleaned);
  if (!result.success) {
    throw new EnvValidationError(
      result.error.issues.map((issue) => `  ✖ ${issue.path.join(".") || "(root)"} → ${issue.message}`),
    );
  }
  return result.data;
}
