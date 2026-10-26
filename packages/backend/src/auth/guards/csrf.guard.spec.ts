import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { CsrfGuard } from "./csrf.guard.js";

const ctx = (method: string, headers: Record<string, string> = {}) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ method, headers }) }) }) as unknown as ExecutionContext;

describe("CsrfGuard", () => {
  const guard = new CsrfGuard();
  const front = "http://localhost:3000";

  it("GET sempre passa", () => expect(guard.canActivate(ctx("GET", { cookie: "a=b" }))).toBe(true));
  it("POST sem cookie passa (não há credencial ambiente)", () => expect(guard.canActivate(ctx("POST"))).toBe(true));
  it("POST com cookie e Origin confiável passa", () =>
    expect(guard.canActivate(ctx("POST", { cookie: "a=b", origin: front }))).toBe(true));
  it("aceita Referer quando não há Origin", () =>
    expect(guard.canActivate(ctx("POST", { cookie: "a=b", referer: `${front}/x` }))).toBe(true));
  it.each<Record<string, string>>([{}, { origin: "https://evil.com" }, { origin: "null" }])("POST com cookie e %j → 403", (extra) =>
    expect(() => guard.canActivate(ctx("POST", { cookie: "a=b", ...extra }))).toThrow(ForbiddenException));
});
