// export functions here
//
// Exemplo de acesso ao banco/RBAC compartilhado:
//   import { userRepository } from "bangboo-shared/db";
//   import { Role, hasRole } from "bangboo-shared/rbac";
//   const user = await userRepository.findByDiscordId(interaction.user.id);
//   if (user && hasRole(user.role, Role.ADMIN)) { ... }
export {};
