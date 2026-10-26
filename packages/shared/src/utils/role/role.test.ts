import { describe, expect, it } from "bun:test";
import { Role, hasAnyRole, hasRole, isRole } from "./role.js";

describe("rbac", () => {
  it("hierarquia ROOT > ADMIN > PREMIUM > USER", () => {
    expect(hasRole(Role.ROOT, Role.ADMIN)).toBe(true);
    expect(hasRole(Role.ADMIN, Role.PREMIUM)).toBe(true);
    expect(hasRole(Role.USER, Role.PREMIUM)).toBe(false);
    expect(hasRole(Role.PREMIUM, Role.PREMIUM)).toBe(true);
  });
  it("hasAnyRole", () => {
    expect(hasAnyRole(Role.USER, [])).toBe(true);
    expect(hasAnyRole(Role.PREMIUM, [Role.ADMIN, Role.PREMIUM])).toBe(true);
    expect(hasAnyRole(Role.USER, [Role.ADMIN])).toBe(false);
  });
  it("isRole", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("god")).toBe(false);
  });
});
