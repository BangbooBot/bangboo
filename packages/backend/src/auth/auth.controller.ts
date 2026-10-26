import { Controller, Get, HttpCode, Post, Query, Req, Res } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { backendEnv as env } from "bangboo-shared/env/backend";
import type { Request, Response } from "express";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe.js";
import { AuthCookies } from "./auth-cookies.service.js";
import { AUTH_THROTTLE } from "./auth.constants.js";
import { AuthService } from "./auth.service.js";
import { Auth, CurrentUser, Public } from "./decorators/index.js";
import type { AuthenticatedUser } from "./auth.types.js";
import { AuthLoginQueryDto } from "./dto/auth-login-query.dto.js";
import { CallbackQueryDto } from "./dto/auth-callback-query.dto.js";
import { AuthUserDto } from "./dto/auth-user.dto.js";


@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookies: AuthCookies,
  ) {}

  /** Inicia o OAuth2: redireciona para o Discord. `?redirect=/rota` define para onde voltar. */
  @Public()
  @Throttle(AUTH_THROTTLE)
  @Get("login")
  async login(@Query() query: AuthLoginQueryDto, @Res() res: Response): Promise<void> {
    const { url, setCookies } = await this.authService.beginLogin(query.redirect);
    this.cookies.relay(res, setCookies);
    res.redirect(302, url);
  }

  /** Retorno do Discord: valida state, cria/atualiza usuário, cria sessão e emite o JWT. */
  @Public()
  @Throttle(AUTH_THROTTLE)
  @Get("callback")
  async callback(
    @Query() query: CallbackQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { location, setCookies, accessToken } = await this.authService.handleCallback(query, req.headers);
    this.cookies.relay(res, setCookies);
    if (accessToken) this.cookies.setAccessToken(res, accessToken);
    res.redirect(302, location);
  }

  /**
   * Troca o refresh token (cookie de sessão, `path=/auth`) por um novo access token.
   * É `@Public()` porque o access token pode já ter expirado — quem autentica aqui é a sessão.
   */
  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ expiresIn: number }> {
    try {
      const { accessToken, setCookies } = await this.authService.refresh(req.headers);
      this.cookies.relay(res, setCookies);
      this.cookies.setAccessToken(res, accessToken);
      return { expiresIn: env.ACCESS_TOKEN_TTL };
    } catch (error) {
      this.cookies.clearAccessToken(res);
      throw error;
    }
  }

  /** Revoga a sessão no banco e apaga os cookies. Idempotente. */
  @Public()
  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ success: true }> {
    const setCookies = await this.authService.logout(req.headers);
    this.cookies.relay(res, setCookies);
    this.cookies.clearAccessToken(res);
    return { success: true };
  }

  /** Usuário autenticado (dados frescos do banco). */
  @Auth()
  @SkipThrottle()
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserDto> {
    return this.authService.getProfile(user.id);
  }

  /** Chaves públicas (JWKS) para outros serviços verificarem o access token. */
  @Public()
  @Get("jwks")
  jwks() {
    return this.authService.getJwks();
  }
}
