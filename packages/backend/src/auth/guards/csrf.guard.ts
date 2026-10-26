import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { backendEnv as env } from "bangboo-shared/env/backend";
import type { Request } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const originOf = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

/**
 * Proteção CSRF para métodos que alteram estado.
 *
 * Os cookies já são `HttpOnly` + `SameSite=Lax`; esta guard adiciona a checagem de `Origin`
 * (ou `Referer`) contra as origens confiáveis. Requests SEM cookie (ex.: `Authorization: Bearer`
 * de um cliente não-navegador) não carregam credencial "ambiente", logo não são alvo de CSRF.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly allowedOrigins = new Set(
    [originOf(env.FRONTEND_URL), originOf(env.BACKEND_URL)].filter((origin): origin is string => Boolean(origin)),
  );

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;
    if (!request.headers.cookie) return true;

    const origin = request.headers.origin ?? originOf(request.headers.referer);
    if (!origin || !this.allowedOrigins.has(origin)) {
      throw new ForbiddenException("Cross-site request blocked");
    }
    return true;
  }
}
