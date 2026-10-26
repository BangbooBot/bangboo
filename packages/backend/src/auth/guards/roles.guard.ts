import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasAnyRole, type Role } from "bangboo-shared/rbac";
import { ROLES_KEY } from "../auth.constants.js";
import type { AuthenticatedRequest } from "../auth.types.js";

/** Autorização (RBAC). Roda depois do `AuthGuard`; sem `@Roles()`/`@Auth(role)` não restringe nada. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) throw new UnauthorizedException("Authentication required");
    if (!hasAnyRole(user.role, required)) throw new ForbiddenException("Insufficient role");
    return true;
  }
}
