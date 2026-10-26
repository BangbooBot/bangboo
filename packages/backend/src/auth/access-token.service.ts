import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JWT_AUDIENCE, JWT_ISSUER, type Auth } from 'bangboo-shared/auth';
import {
  createLocalJWKSet,
  errors,
  jwtVerify,
  type JSONWebKeySet,
  type JWTVerifyGetKey,
} from 'jose';
import { AUTH } from './auth.constants.js';
import { AccessTokenClaimsDto, accessTokenClaimsSchema } from './dto/auth-access-token-claims.dto.js';
import z from 'zod';

const KEYSET_TTL_MS = 5 * 60_000;

/**
 * Valida o access token (JWT) LOCALMENTE com as chaves públicas (JWKS) do Better Auth.
 * O JWKS fica em cache; se aparecer um `kid` desconhecido (rotação de chaves) recarregamos uma vez.
 */
@Injectable()
export class AccessTokenService {
  private cache?: { keys: JWTVerifyGetKey; loadedAt: number };

  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  private async keySet(force = false): Promise<JWTVerifyGetKey> {
    if (
      !force &&
      this.cache &&
      Date.now() - this.cache.loadedAt < KEYSET_TTL_MS
    )
      return this.cache.keys;
    const jwks = (await this.auth.api.getJwks()) as JSONWebKeySet;
    this.cache = { keys: createLocalJWKSet(jwks), loadedAt: Date.now() };
    return this.cache.keys;
  }

  private async verifyOnce(token: string, keys: JWTVerifyGetKey) {
    return jwtVerify(token, keys, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['EdDSA'],
    });
  }

  async verify(token: string): Promise<z.infer<typeof accessTokenClaimsSchema>> {
    try {
      let result;
      try {
        result = await this.verifyOnce(token, await this.keySet());
      } catch (error) {
        if (!(error instanceof errors.JWKSNoMatchingKey)) throw error;
        result = await this.verifyOnce(token, await this.keySet(true));
      }

      const claims = accessTokenClaimsSchema.safeParse(result.payload);
      if (!claims.success)
        throw new UnauthorizedException('Malformed access token');
      return claims.data;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      if (error instanceof errors.JWTExpired)
        throw new UnauthorizedException('Access token expired');
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
