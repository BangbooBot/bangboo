import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { backendEnv as env } from "bangboo-shared/env/backend";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { ZodValidationPipe } from 'nestjs-zod';

function parseTrustProxy(value: string | undefined): boolean | number | undefined {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : undefined;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const trustProxy = parseTrustProxy(env.TRUST_PROXY);
  if (trustProxy !== undefined) app.set("trust proxy", trustProxy);

  app.useGlobalPipes(new ZodValidationPipe());

  app.use(helmet());
  app.enableCors({
    origin: [new URL(env.FRONTEND_URL).origin],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });
  app.enableShutdownHooks();

  await app.listen(env.BACKEND_PORT);
}

await bootstrap();
