import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const loginQuerySchema = z.object({
  /** Caminho interno do frontend para onde voltar após o login (ex.: `/dashboard`). */
  redirect: z.string().max(512).optional(),
});

export class AuthLoginQueryDto extends createZodDto(loginQuerySchema) {}
