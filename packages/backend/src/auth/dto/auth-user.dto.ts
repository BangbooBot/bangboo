import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { roleSchema } from './auth-role.dto.js';

export const authUserQuerySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  discordId: z.string().nullable(),
  role: roleSchema,
  createdAt: z.string(),
});

export class AuthUserDto extends createZodDto(authUserQuerySchema) {}
