import { bootstrap } from "@constatic/base";
// O bot só importa o env do bot (sem segredos de OAuth/JWT) — `bangboo-shared/env/bot`.
import { botEnv } from "bangboo-shared/env/bot";

await bootstrap({ meta: import.meta, env: botEnv });
