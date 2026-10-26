import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins/jwt";
import { account, db, jwks, session, user, verification } from "../db/index.js";
import { backendEnv as env } from "../env/backend.js";
import { DEFAULT_ROLE, Role } from "bangboo-shared";
import { syncRootRole } from "./root-sync.js";

const DAY = 60 * 60 * 24;
const originOf = (url: string) => new URL(url).origin;

/** Prefixo dos cookies: `bangboo.session_token`, `bangboo.access_token`, ... */
export const COOKIE_PREFIX = "bangboo";

/** Claims do JWT: `iss`/`aud` são verificados no `AuthGuard`. */
export const JWT_ISSUER = env.BACKEND_URL;
export const JWT_AUDIENCE = env.BACKEND_URL;

export const auth = betterAuth({
  appName: "Bangboo",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BACKEND_URL,
  // Só estas origens podem receber redirects (callbackURL) e fazer requests com cookies.
  trustedOrigins: [originOf(env.FRONTEND_URL), originOf(env.BACKEND_URL)],

  // Falhas de OAuth que o Better Auth trataria em /api/auth/error vão para o frontend.
  onAPIError: { errorURL: `${env.FRONTEND_URL}/` },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification, jwks },
  }),

  user: {
    additionalFields: {
      // `input: false` → nunca aceitos vindos do cliente; só o servidor define.
      role: { type: "string", required: false, defaultValue: DEFAULT_ROLE, input: false },
      discordId: { type: "string", required: false, input: false },
    },
  },

  /**
   * "Refresh token" do projeto: a sessão é um token opaco, guardado no banco
   * (revogável), em cookie HttpOnly assinado. Só serve para `/auth/refresh`
   * e `/auth/logout` (cookie com `path=/auth`) e tem expiração deslizante.
   */
  session: {
    expiresIn: env.REFRESH_TOKEN_TTL,
    updateAge: DAY,
  },

  account: {
    // tokens OAuth do Discord ficam criptografados em repouso
    encryptOAuthTokens: true,
  },

  socialProviders: {
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      // Deve bater com o cadastrado no portal do Discord e apontar para GET /auth/callback.
      redirectURI: env.DISCORD_REDIRECT_URI,
      // Atualiza nome/avatar a cada login (o role NÃO é mapeado aqui de propósito).
      overrideUserInfoOnSignIn: true,
    },
  },

  plugins: [
    /**
     * Access token: JWT curto (EdDSA) assinado com chaves guardadas na tabela `jwks`.
     * O backend o valida localmente (sem ida ao banco por request).
     */
    jwt({
      jwks: {
        keyPairConfig: { alg: "EdDSA", crv: "Ed25519" },
        rotationInterval: 30 * DAY,
        gracePeriod: 30 * DAY,
      },
      jwt: {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        expirationTime: `${env.ACCESS_TOKEN_TTL}s`,
        definePayload: ({ user: u, session: s }) => ({
          role: u.role ?? DEFAULT_ROLE,
          discordId: u.discordId ?? null,
          sid: s.id,
        }),
      },
      // não vazar o JWT no header `set-auth-jwt` das respostas de sessão
      disableSettingJwtHeader: true,
    }),
  ],

  databaseHooks: {
    session: {
      create: {
        // Roda em todo login (novo usuário ou não): garante o papel ROOT antes do JWT ser emitido.
        before: async (newSession) => {
          await syncRootRole(newSession.userId, env.ROOT_DISCORD_IDS);
        },
      },
    },
  },

  advanced: {
    cookiePrefix: COOKIE_PREFIX,
    useSecureCookies: env.secureCookies,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: env.secureCookies,
      sameSite: "lax",
      ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    },
    cookies: {
      // refresh token só trafega para /auth/*
      session_token: { attributes: { path: "/auth" } },
    },
    database: {
      // ids gerados pelo banco (uuidv7())
      generateId: false,
      joins: true,
    },
  },
});

export type Auth = typeof auth;
export { Role };
