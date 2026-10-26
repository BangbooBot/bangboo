const BASE = process.env.E2E_BASE_URL ?? "http://localhost:8099";
const FRONT = "http://localhost:3000";
const jar = new Map<string, string>();            // cookie jar ingênuo (nome → valor)
const attrs = new Map<string, string>();          // nome → atributos do Set-Cookie (p/ inspeção)
let failures = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) failures++; console.log(`${ok ? "✓" : "✗ FAIL"} ${name}${extra ? "  → " + extra : ""}`); };

function absorb(res: Response) {
  for (const sc of res.headers.getSetCookie()) {
    const [pair, ...rest] = sc.split(";"); const i = pair!.indexOf("=");
    const n = pair!.slice(0, i).trim(), v = pair!.slice(i + 1).trim();
    attrs.set(n, rest.join(";").trim());
    if (v === "" || /max-age=0/i.test(sc) || /expires=thu, 01 jan 1970/i.test(sc)) jar.delete(n); else jar.set(n, v);
  }
}
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
async function req(path: string, init: RequestInit & { origin?: string; noCookies?: boolean } = {}) {
  const headers = new Headers(init.headers);
  if (!init.noCookies && jar.size) headers.set("cookie", cookieHeader());
  if (init.origin) headers.set("origin", init.origin);
  const res = await fetch(BASE + path, { ...init, headers, redirect: "manual" });
  absorb(res); return res;
}

async function login(codeSuffix: "root" | "user") {
  jar.clear();
  const r1 = await req("/auth/login?redirect=/dashboard");
  const loc = new URL(r1.headers.get("location")!);
  check(`login(${codeSuffix}) → 302 p/ Discord`, r1.status === 302 && loc.host === "discord.com" && loc.pathname === "/api/oauth2/authorize", loc.host + loc.pathname);
  const state = loc.searchParams.get("state")!;
  check("  state presente + cookie de state HttpOnly", !!state && [...jar.keys()].some((k) => k.endsWith("state")) && /httponly/i.test(attrs.get([...jar.keys()].find((k) => k.endsWith("state"))!) ?? ""));
  check("  redirect_uri = /auth/callback", loc.searchParams.get("redirect_uri") === `${BASE}/auth/callback`, loc.searchParams.get("redirect_uri")!);
  check("  scope identify+email", /identify/.test(loc.searchParams.get("scope")!) && /email/.test(loc.searchParams.get("scope")!));
  return state;
}

// ───────── 0. público x protegido
check("GET /health público", (await req("/health", { noCookies: true })).status === 200);
check("GET /auth/me sem login → 401", (await req("/auth/me", { noCookies: true })).status === 401);
check("GET /auth/jwks público", (await req("/auth/jwks", { noCookies: true })).status === 200);

// ───────── 1. open redirect
{
  const r = await req("/auth/login?redirect=//evil.com"); const st = new URL(r.headers.get("location")!).searchParams.get("state");
  check("login com redirect malicioso ainda funciona (cai em /)", r.status === 302 && !!st);
}

// ───────── 2. login do usuário ROOT
let state = await login("root");
const cbRes = await req(`/auth/callback?code=ok-root&state=${encodeURIComponent(state)}`);
check("callback → 302 para o frontend (/dashboard)", cbRes.status === 302 && cbRes.headers.get("location") === `${FRONT}/dashboard`, cbRes.headers.get("location") ?? "");
const sessName = [...jar.keys()].find((k) => k.endsWith("session_token"))!;
const accName = [...jar.keys()].find((k) => k.endsWith("access_token"))!;
check("cookie de sessão (refresh) criado", !!sessName, sessName);
check("  HttpOnly + SameSite=Lax + Path=/auth", /httponly/i.test(attrs.get(sessName)!) && /samesite=lax/i.test(attrs.get(sessName)!) && /path=\/auth/i.test(attrs.get(sessName)!), attrs.get(sessName));
check("cookie de access token criado", !!accName, accName);
check("  HttpOnly + SameSite=Lax + Path=/ + Max-Age=900", /httponly/i.test(attrs.get(accName)!) && /samesite=lax/i.test(attrs.get(accName)!) && /path=\//i.test(attrs.get(accName)!) && /max-age=900/i.test(attrs.get(accName)!), attrs.get(accName));

const me = await req("/auth/me");
const meJson: any = await me.json();
check("GET /auth/me → 200", me.status === 200, JSON.stringify(meJson));
check("  role=root (ROOT_DISCORD_IDS), discordId correto", meJson.role === "root" && meJson.discordId === "222222222222222222");
check("  não vaza campos internos", !("accessToken" in meJson) && !("password" in meJson));

// bearer funciona e o JWT tem os claims esperados
const jwt = jar.get(accName)!;
const claims = JSON.parse(Buffer.from(jwt.split(".")[1]!, "base64url").toString());
check("JWT: sub/role/sid/iss/aud/exp", !!claims.sub && claims.role === "root" && !!claims.sid && claims.iss === BASE && claims.aud === BASE && claims.exp - claims.iat === 900, JSON.stringify(claims));
check("Authorization: Bearer funciona", (await req("/auth/me", { noCookies: true, headers: { authorization: `Bearer ${jwt}` } })).status === 200);
const parts = jwt.split("."); const tampered = `${parts[0]}.${Buffer.from(JSON.stringify({ ...claims, role: "root", sub: "x" })).toString("base64url")}.${parts[2]}`;
check("JWT adulterado → 401", (await req("/auth/me", { noCookies: true, headers: { authorization: `Bearer ${tampered}` } })).status === 401);
check("JWT 'alg:none' → 401", (await req("/auth/me", { noCookies: true, headers: { authorization: `Bearer ${Buffer.from('{"alg":"none"}').toString("base64url")}.${parts[1]}.` } })).status === 401);

// ───────── 3. refresh
const oldAccess = jar.get(accName)!;
await new Promise((r) => setTimeout(r, 1100));
const rf = await req("/auth/refresh", { method: "POST", origin: FRONT });
check("POST /auth/refresh → 200 e novo access token", rf.status === 200 && jar.get(accName) !== oldAccess, JSON.stringify(await rf.json()));
check("POST /auth/refresh sem Origin (com cookies) → 403 CSRF", (await req("/auth/refresh", { method: "POST" })).status === 403);
check("POST /auth/refresh com Origin evil → 403 CSRF", (await req("/auth/refresh", { method: "POST", origin: "https://evil.com" })).status === 403);

// ───────── 4. logout
const sessionBefore = jar.get(sessName)!;
const lo = await req("/auth/logout", { method: "POST", origin: FRONT });
check("POST /auth/logout → 200", lo.status === 200);
check("  cookies apagados do jar", !jar.has(sessName) && !jar.has(accName), `restantes: [${[...jar.keys()]}]`);
// reusa o cookie de sessão antigo: precisa estar revogado no banco
const rf2 = await fetch(`${BASE}/auth/refresh`, { method: "POST", headers: { cookie: `${sessName}=${sessionBefore}`, origin: FRONT } });
check("refresh com sessão revogada → 401", rf2.status === 401);
check("logout sem sessão é idempotente → 200", (await req("/auth/logout", { method: "POST", origin: FRONT })).status === 200);

// ───────── 5. state / CSRF do OAuth
state = await login("user");
const bad = await req(`/auth/callback?code=ok-user&state=tampered-${state}`);
check("callback com state adulterado → erro (sem sessão)", bad.status === 302 && /error=/.test(bad.headers.get("location") ?? "") && ![...jar.keys()].some((k) => k.endsWith("session_token")), bad.headers.get("location") ?? "");
state = await login("user");
const denied = await req(`/auth/callback?error=access_denied&state=${encodeURIComponent(state)}`);
check("usuário nega no Discord → redirect de erro", denied.status === 302 && /error=access_denied/.test(denied.headers.get("location") ?? ""), denied.headers.get("location") ?? "");
const noState = await req(`/auth/callback?code=ok-user`, { noCookies: true });
check("callback sem state → erro", noState.status === 302 && /error=/.test(noState.headers.get("location") ?? ""), noState.headers.get("location") ?? "");
// state válido, mas SEM o cookie de state (ataque de login CSRF)
state = await login("user"); const stateCookies = new Map(jar); jar.clear();
const noCookie = await req(`/auth/callback?code=ok-user&state=${encodeURIComponent(state)}`, { noCookies: true });
check("callback com state válido porém sem cookie de state → rejeitado", noCookie.status === 302 && /error=/.test(noCookie.headers.get("location") ?? ""), noCookie.headers.get("location") ?? "");
for (const [k, v] of stateCookies) jar.set(k, v);

// ───────── 6. usuário comum
const okUser = await req(`/auth/callback?code=ok-user&state=${encodeURIComponent(state)}`);
check("login usuário comum → 302 /", okUser.status === 302, okUser.headers.get("location") ?? "");
const me2: any = await (await req("/auth/me")).json();
check("  role=user, nome/imagem do Discord", me2.role === "user" && me2.name === "Plain User" && /cdn\.discordapp\.com\/embed\/avatars/.test(me2.image), JSON.stringify(me2));

// segundo login do MESMO usuário não duplica
const s3 = await login("user");
await req(`/auth/callback?code=ok-user&state=${encodeURIComponent(s3)}`);
const me3: any = await (await req("/auth/me")).json();
check("re-login atualiza (mesmo id, sem duplicar)", me3.id === me2.id);

console.log(failures === 0 ? "\nTODOS OS CHECKS PASSARAM" : `\n${failures} CHECK(S) FALHARAM`);
process.exit(failures ? 1 : 0);
