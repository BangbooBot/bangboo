import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { auth } from "bangboo-shared/auth";
import { AccessTokenService } from "./access-token.service.js";
import { AuthCookies } from "./auth-cookies.service.js";
import { AUTH } from "./auth.constants.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AuthGuard } from "./guards/auth.guard.js";
import { CsrfGuard } from "./guards/csrf.guard.js";
import { RolesGuard } from "./guards/roles.guard.js";

@Module({
  imports: [ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 120 }])],
  controllers: [AuthController],
  providers: [
    { provide: AUTH, useValue: auth },
    AuthCookies,
    AccessTokenService,
    AuthService,
    // A ordem importa: rate limit → CSRF → autenticação → autorização (RBAC)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AUTH, AuthCookies, AccessTokenService],
})
export class AuthModule {}
