// Intercepta SÓ as chamadas ao Discord; o resto passa para o fetch real.
const realFetch = globalThis.fetch.bind(globalThis);
const profiles: Record<string, any> = {
  "tok-root": { id: "222222222222222222", username: "rootuser", global_name: "Root User", email: "root@example.com", verified: true, avatar: "abc", discriminator: "0" },
  "tok-user": { id: "333333333333333333", username: "plainuser", global_name: "Plain User", email: "plain@example.com", verified: true, avatar: null, discriminator: "0" },
};
globalThis.fetch = (async (input: any, init?: any) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url === "https://discord.com/api/oauth2/token") {
    const body = new URLSearchParams(String(init?.body ?? await input.text?.()));
    const code = body.get("code") ?? "";
    if (!code.startsWith("ok-")) return Response.json({ error: "invalid_grant" }, { status: 400 });
    return Response.json({ access_token: code === "ok-root" ? "tok-root" : "tok-user", token_type: "Bearer", expires_in: 604800, refresh_token: "discord-refresh", scope: "identify email" });
  }
  if (decodeURIComponent(url) === "https://discord.com/api/users/@me") {
    const auth = new Headers(init?.headers).get("authorization") ?? "";
    return Response.json(profiles[auth.replace("Bearer ", "")] ?? { message: "401" }, { status: profiles[auth.replace("Bearer ", "")] ? 200 : 401 });
  }
  return realFetch(input, init);
}) as typeof fetch;
