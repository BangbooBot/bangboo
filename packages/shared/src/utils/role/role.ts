/**
 * Papéis (RBAC) da plataforma.
 *
 * É um `enum` de string real (e não só um union type) para que `Role.ADMIN`
 * funcione como valor em runtime, no schema do Drizzle e nos decorators.
 */
export enum Role {
  ROOT = "root",
  ADMIN = "admin",
  PREMIUM = "premium",
  USER = "user",
}

/**
 * Hierarquia em ordem CRESCENTE de privilégio.
 * Um papel herda tudo que os papéis anteriores da lista podem fazer.
 */
export const ROLE_HIERARCHY = [Role.USER, Role.PREMIUM, Role.ADMIN, Role.ROOT] as const satisfies readonly Role[];

export const ROLES: readonly Role[] = ROLE_HIERARCHY;

/** Papel atribuído a qualquer usuário recém-criado. */
export const DEFAULT_ROLE = Role.USER;

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Posição do papel na hierarquia (maior = mais privilégio). */
export function roleRank(role: Role): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * `true` se `userRole` possui AO MENOS o privilégio de `required`.
 * Ex.: `hasRole(Role.ADMIN, Role.PREMIUM) === true`.
 */
export function hasRole(userRole: Role, required: Role): boolean {
  return roleRank(userRole) >= roleRank(required);
}

/**
 * `true` se `userRole` satisfaz QUALQUER um dos papéis exigidos
 * (respeitando a hierarquia). Lista vazia = sem restrição de papel.
 */
export function hasAnyRole(userRole: Role, required: readonly Role[]): boolean {
  if (required.length === 0) return true;
  return required.some((role) => hasRole(userRole, role));
}
