/** Token de DI da instância do Better Auth. */
export const AUTH = Symbol("BETTER_AUTH");

/** Nome (sem prefixo) do cookie do access token. */
export const ACCESS_TOKEN_COOKIE = "access_token";

/** Metadata dos decorators. */
export const IS_PUBLIC_KEY = "auth:isPublic";
export const IS_AUTHENTICATED_KEY = "auth:isAuthenticated";
export const ROLES_KEY = "auth:roles";

/** Limite "estrito" de requests para as rotas sensíveis de auth. */
export const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } } as const;
