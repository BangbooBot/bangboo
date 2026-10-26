/**
 * Protege contra *open redirect*: só aceita caminhos internos do frontend.
 * Qualquer coisa suspeita cai em `/`.
 *
 *   "/dashboard?tab=1"   → https://app/dashboard?tab=1
 *   "//evil.com", "https://evil.com", "/\\evil.com", "javascript:..." → https://app/
 */
export function resolveFrontendRedirect(input: string | undefined, frontendUrl: string): string {
  const base = new URL(frontendUrl);
  const fallback = new URL("/", base).toString();

  if (!input) return fallback;
  if (!input.startsWith("/") || input.startsWith("//")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (input.includes("\\") || /[\u0000-\u001f\u007f]/.test(input)) return fallback;

  try {
    const url = new URL(input, base);
    return url.origin === base.origin ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}
