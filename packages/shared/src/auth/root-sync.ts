import { Role } from "../rbac/role.js";
import { userRepository } from "../db/repositories/index.js";

/**
 * Sincroniza identidade e papel a cada login.
 *
 * ROOT é controlado EXCLUSIVAMENTE por `ROOT_DISCORD_IDS`:
 *  - quem está na lista e não é ROOT  → promovido a ROOT;
 *  - quem é ROOT mas saiu da lista    → rebaixado a ADMIN.
 * Demais papéis (admin/premium/user) são geridos pela aplicação e não são tocados.
 */
export async function syncRootRole(userId: string, rootDiscordIds: readonly string[]): Promise<void> {
  let current = await userRepository.findById(userId);
  if (!current) return;

  // `discordId` é derivado da conta Discord vinculada (fonte da verdade), não de input do cliente.
  const linked = await userRepository.findDiscordAccountId(userId);
  if (linked && current.discordId !== linked) {
    await userRepository.setDiscordId(current.id, linked);
    current = { ...current, discordId: linked };
  }

  const shouldBeRoot = current.discordId !== null && rootDiscordIds.includes(current.discordId);

  if (shouldBeRoot && current.role !== Role.ROOT) {
    await userRepository.updateRole(current.id, Role.ROOT);
  } else if (!shouldBeRoot && current.role === Role.ROOT) {
    await userRepository.updateRole(current.id, Role.ADMIN);
  }
}
