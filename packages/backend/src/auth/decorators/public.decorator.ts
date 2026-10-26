import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_KEY } from "../auth.constants.js";

/** Libera a rota do `AuthGuard` global (por padrão TODA rota exige autenticação). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
