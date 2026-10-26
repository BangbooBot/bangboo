import { SetMetadata } from "@nestjs/common";
import type { Role } from "bangboo-shared/rbac";
import { ROLES_KEY } from "../auth.constants.js";

/**
 * Exige um dos papéis informados, respeitando a hierarquia
 * (ROOT > ADMIN > PREMIUM > USER): `@Roles(Role.PREMIUM)` também libera ADMIN e ROOT.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
