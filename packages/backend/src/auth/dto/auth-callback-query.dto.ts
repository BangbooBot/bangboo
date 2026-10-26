import { createZodDto } from 'nestjs-zod';
import z from 'zod';

/** Parâmetros que o Discord devolve em `/auth/callback`. */
const callbackQuerySchema = z.object({
  code: z.string().max(2048).optional(),
  state: z.string().max(2048).optional(),
  error: z.string().max(256).optional(),
  error_description: z.string().max(1024).optional(),
  iss: z.string().max(2048).optional(),
});

export class CallbackQueryDto extends createZodDto(callbackQuerySchema) {}
