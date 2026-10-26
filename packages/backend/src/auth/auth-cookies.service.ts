import { Inject, Injectable } from "@nestjs/common";
import { parseCookies, type Auth } from "bangboo-shared/auth";
import { backendEnv as env } from "bangboo-shared/env/backend";
import type { CookieOptions, Request, Response } from "express";
import { ACCESS_TOKEN_COOKIE, AUTH } from "./auth.constants.js";

type SetCookieOptions = CookieOptions;

/** Tudo que envolve cookies de auth fica aqui (nomes, atributos, leitura e limpeza). */
@Injectable()
export class AuthCookies {
  readonly accessTokenName = `${env.secureCookies ? "__Secure-" : ""}bangboo.${ACCESS_TOKEN_COOKIE}`;

  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  /** Nome real do cookie de sessão (refresh token), conforme config do Better Auth. */
  async sessionCookieName(): Promise<string> {
    const ctx = await this.auth.$context;
    return ctx.authCookies.sessionToken.name;
  }

  private accessTokenOptions(): SetCookieOptions {
    return {
      httpOnly: true,
      secure: env.secureCookies,
      sameSite: "lax",
      path: "/",
      ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    };
  }

  setAccessToken(res: Response, token: string): void {
    res.cookie(this.accessTokenName, token, { ...this.accessTokenOptions(), maxAge: env.ACCESS_TOKEN_TTL * 1000 });
  }

  clearAccessToken(res: Response): void {
    res.clearCookie(this.accessTokenName, this.accessTokenOptions());
  }

  readAccessToken(req: Request): string | undefined {
    const header = req.headers.cookie;
    if (!header) return undefined;
    return parseCookies(header).get(this.accessTokenName) || undefined;
  }

  /** Repassa os `Set-Cookie` produzidos pelo Better Auth (state, sessão...) para a resposta. */
  relay(res: Response, setCookies: readonly string[]): void {
    for (const cookie of setCookies) res.append("Set-Cookie", cookie);
  }

  /** Extrai `nome=valor` de um `Set-Cookie` (sem atributos). Ignora cookies que estejam sendo apagados. */
  static pairFrom(setCookies: readonly string[], name: string): string | undefined {
    for (const raw of setCookies) {
      const [pair = ""] = raw.split(";");
      const idx = pair.indexOf("=");
      if (idx === -1 || pair.slice(0, idx).trim() !== name) continue;
      const value = pair.slice(idx + 1).trim();
      return value ? `${name}=${value}` : undefined;
    }
    return undefined;
  }
}
