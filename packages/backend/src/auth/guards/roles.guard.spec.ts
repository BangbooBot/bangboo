import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "bangboo-shared";
import { Roles } from "../decorators/index.js";
import { RolesGuard } from "./roles.guard.js";

function contextFor(handler: () => void, user?: { role: Role }): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function handlerWith(...roles: Role[]) {
  class C {
    @Roles(...roles) m() {}
  }
  return C.prototype.m;
}

describe("RolesGuard", () => {
  const guard = new RolesGuard(new Reflector());

  it("sem @Roles não restringe", () => {
    expect(guard.canActivate(contextFor(() => {}, { role: Role.USER }))).toBe(true);
  });

  it("respeita a hierarquia (ADMIN satisfaz PREMIUM)", () => {
    expect(guard.canActivate(contextFor(handlerWith(Role.PREMIUM), { role: Role.ADMIN }))).toBe(true);
    expect(guard.canActivate(contextFor(handlerWith(Role.ADMIN), { role: Role.ROOT }))).toBe(true);
  });

  it("bloqueia papel inferior com 403", () => {
    expect(() => guard.canActivate(contextFor(handlerWith(Role.ADMIN), { role: Role.PREMIUM }))).toThrow(ForbiddenException);
  });

  it("sem usuário → 401", () => {
    expect(() => guard.canActivate(contextFor(handlerWith(Role.USER)))).toThrow(UnauthorizedException);
  });
});
