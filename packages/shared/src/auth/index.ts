export * from "./auth.js";
export * from "./root-sync.js";
// utilitários de cookie do Better Auth, reexportados para que os apps dependam só de `bangboo-shared`
export { parseCookies, parseSetCookieHeader, splitSetCookieHeader } from "better-auth/cookies";
