import { Inject, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from "@nestjs/common";
import type { Auth } from "bangboo-shared/auth";
import type { UserRepository } from "bangboo-shared/db";
import { backendEnv as env } from "bangboo-shared/env/backend";
import type { IncomingHttpHeaders } from "node:http";
import { InjectUserRepository } from "../database/database.module.js";
import { AuthCookies } from "./auth-cookies.service.js";
import { AUTH } from "./auth.constants.js";
import { resolveFrontendRedirect } from "./redirect.util.js";
import { CallbackQueryDto } from "./dto/auth-callback-query.dto.js";
import { AuthUserDto } from "./dto/auth-user.dto.js";

export interface LoginResult {
  /** URL de autorização do Discord (já com `state` e PKCE). */
  url: string;
  setCookies: string[];
}

export interface CallbackResult {
  /** Para onde redirecionar o navegador (frontend, ou página de erro). */
  location: string;
  setCookies: string[];
  /** Presente apenas quando o login deu certo. */
  accessToken: string | null;
}

export interface RefreshResult {
  accessToken: string;
  setCookies: string[];
}

/** Converte os headers do Node/Express no `Headers` da Web API que o Better Auth espera. */
export function toWebHeaders(source: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
    else headers.set(key, value);
  }
  return headers;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly cookies: AuthCookies,
    @InjectUserRepository() private readonly users: UserRepository,
  ) {}

  /** Passo 1 — gera `state` + PKCE e devolve a URL de autorização do Discord. */
  async beginLogin(redirect: string | undefined): Promise<LoginResult> {
    const callbackURL = resolveFrontendRedirect(redirect, env.FRONTEND_URL);
    const errorCallbackURL = resolveFrontendRedirect("/", env.FRONTEND_URL);

    const { headers, response } = await this.auth.api.signInSocial({
      body: { provider: "discord", callbackURL, errorCallbackURL, disableRedirect: true },
      returnHeaders: true,
    });

    if (!response.url) throw new InternalServerErrorException("Could not start the Discord login");
    return { url: response.url, setCookies: headers.getSetCookie() };
  }

  /**
   * Passo 2 — o Better Auth valida `state`/PKCE, troca o `code`, busca o usuário no Discord,
   * cria/atualiza o usuário e cria a sessão. Aqui só emitimos o access token (JWT) em seguida.
   */
  async handleCallback(query: CallbackQueryDto, requestHeaders: IncomingHttpHeaders): Promise<CallbackResult> {
    const response = await this.auth.api.callbackOAuth({
      params: { id: "discord" },
      query,
      headers: toWebHeaders(requestHeaders),
      asResponse: true,
    });

    const setCookies = response.headers.getSetCookie();
    const location = response.headers.get("location") ?? resolveFrontendRedirect("/", env.FRONTEND_URL);

    const sessionPair = AuthCookies.pairFrom(setCookies, await this.cookies.sessionCookieName());
    if (!sessionPair) {
      // Falha (usuário negou, state inválido, erro no Discord...): o Better Auth já montou o redirect de erro.
      this.logger.warn(`OAuth callback finished without a session (${new URL(location, env.FRONTEND_URL).search || "no query"})`);
      return { location, setCookies, accessToken: null };
    }

    const accessToken = await this.mintAccessToken(new Headers({ cookie: sessionPair }));
    return { location, setCookies, accessToken };
  }

  /** Troca o refresh token (cookie de sessão) por um novo access token. Estende a sessão (expiração deslizante). */
  async refresh(requestHeaders: IncomingHttpHeaders): Promise<RefreshResult> {
    const headers = toWebHeaders(requestHeaders);
    const { headers: responseHeaders, response } = await this.auth.api.getSession({ headers, returnHeaders: true });
    if (!response) throw new UnauthorizedException("Invalid or expired session");

    return { accessToken: await this.mintAccessToken(headers), setCookies: responseHeaders.getSetCookie() };
  }

  /** Revoga a sessão no banco e devolve os `Set-Cookie` que a apagam do navegador. */
  async logout(requestHeaders: IncomingHttpHeaders): Promise<string[]> {
    try {
      const response = await this.auth.api.signOut({ headers: toWebHeaders(requestHeaders), asResponse: true });
      return response.headers.getSetCookie();
    } catch (error) {
      // Sem sessão válida não há o que revogar; logout continua idempotente.
      this.logger.debug(`signOut without a valid session: ${String(error)}`);
      return [];
    }
  }

  async getProfile(userId: string): Promise<AuthUserDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException("User no longer exists");
    const authUserDto: AuthUserDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      discordId: user.discordId,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
    return authUserDto;
  }

  async getJwks() {
    return this.auth.api.getJwks();
  }

  private async mintAccessToken(headers: Headers): Promise<string> {
    const { token } = await this.auth.api.getToken({ headers });
    return token;
  }
}
