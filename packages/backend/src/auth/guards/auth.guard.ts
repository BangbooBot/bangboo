import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AccessTokenService } from "../access-token.service.js";
import { AuthCookies } from "../auth-cookies.service.js";
import { IS_PUBLIC_KEY } from "../auth.constants.js";
import type { AuthenticatedRequest } from "../auth.types.js";

/**
 * Guard GLOBAL: toda rota exige um access token válido, exceto as marcadas com `@Public()`.
 * O token vem do cookie HttpOnly (dashboard) ou de `Authorization: Bearer` (clientes de API).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cookies: AuthCookies,
    private readonly accessTokens: AccessTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.cookies.readAccessToken(request) ?? this.bearerToken(request);
    if (!token) throw new UnauthorizedException("Authentication required");

    const claims = await this.accessTokens.verify(token);
    request.user = { id: claims.sub, role: claims.role, discordId: claims.discordId, sessionId: claims.sid };
    return true;
  }

  private bearerToken(request: AuthenticatedRequest): string | undefined {
    const [scheme, value] = request.headers.authorization?.split(" ") ?? [];
    return scheme?.toLowerCase() === "bearer" && value ? value : undefined;
  }
}
