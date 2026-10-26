import { applyDecorators, SetMetadata } from "@nestjs/common";
import type { Role } from "bangboo-shared/rbac";
import { IS_AUTHENTICATED_KEY } from "../auth.constants.js";
import { Roles } from "./roles.decorator.js";

/**
 * Marca a rota (ou controller) como autenticada e, opcionalmente, restringe por papel.
 *
 *   @Auth()               → qualquer usuário logado
 *   @Auth(Role.ADMIN)     → ADMIN ou superior
 *
 * Obs.: o `AuthGuard` já é global e nega por padrão; `@Auth()` documenta a intenção
 * e é o ponto único para declarar o papel exigido.
 */
export const Auth = (...roles: Role[]) =>
  applyDecorators(SetMetadata(IS_AUTHENTICATED_KEY, true), Roles(...roles));
