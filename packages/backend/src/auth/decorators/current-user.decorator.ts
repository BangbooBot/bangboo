import { createParamDecorator, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest, AuthenticatedUser } from "../auth.types.js";

/** Injeta o usuário autenticado (preenchido pelo `AuthGuard`). */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.user) throw new UnauthorizedException();
  return request.user;
});
