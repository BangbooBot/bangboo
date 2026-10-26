/**
 * Entrada "leve" do pacote: SEM efeitos colaterais (não lê env, não conecta no
 * banco). Pode ser importada por qualquer app, inclusive o frontend.
 *
 * Módulos pesados têm subpaths próprios:
 *   bangboo-shared/env | env/bot | env/backend | db | auth
 */
export * from "./utils/index.js";
