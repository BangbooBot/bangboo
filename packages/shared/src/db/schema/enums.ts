import { Role } from "bangboo-shared";
import { dbSchema } from "./pg-schema.js";

/**
 * Enum nativo do Postgres espelhando o enum `Role` do TypeScript.
 * Para adicionar um papel: altere `Role` e gere uma migration.
 */
export const roleEnum = dbSchema.enum("role", [Role.ROOT, Role.ADMIN, Role.PREMIUM, Role.USER]);
