import z from 'zod';
import { roleSchema } from './auth-role.dto.js';
import { createZodDto } from 'nestjs-zod/dto';

export const accessTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  role: roleSchema,
  discordId: z.string().nullable(),
  /** id da sessão (refresh token) que originou este access token */
  sid: z.string().min(1),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export class AccessTokenClaimsDto extends createZodDto(accessTokenClaimsSchema) {}
