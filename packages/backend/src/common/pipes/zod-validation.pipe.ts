import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { z } from "zod";

/** Valida/normaliza input com um schema Zod (os mesmos schemas do `bangboo-shared/dtos`). */
export class ZodValidationPipe<S extends z.ZodType> implements PipeTransform<unknown, z.output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        issues: result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }
    return result.data;
  }
}
