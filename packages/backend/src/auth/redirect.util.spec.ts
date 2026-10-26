import { resolveFrontendRedirect } from "./redirect.util.js";

const FRONT = "https://app.example.com";

describe("resolveFrontendRedirect", () => {
  it("aceita caminhos internos", () => {
    expect(resolveFrontendRedirect("/dashboard?tab=1", FRONT)).toBe("https://app.example.com/dashboard?tab=1");
  });

  it.each([undefined, "", "dashboard", "//evil.com", "https://evil.com", "/\\evil.com", "/\t/evil.com", "javascript:alert(1)", "/\u0000x"])(
    "cai em / para %j",
    (input) => {
      expect(resolveFrontendRedirect(input, FRONT)).toBe("https://app.example.com/");
    },
  );
});
