import { and, eq, inArray } from "drizzle-orm";
import { Role } from "../../rbac/role.js";
import type { Database } from "../client.js";
import { account, user } from "../schema/index.js";

export type UserRecord = typeof user.$inferSelect;

/**
 * Acesso a dados de usuários. Só usa o query builder do Drizzle
 * (parametrizado) — nenhum SQL concatenado.
 */
export function createUserRepository(db: Database) {
  return {
    async findById(id: string): Promise<UserRecord | undefined> {
      const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1);
      return row;
    },

    async findByDiscordId(discordId: string): Promise<UserRecord | undefined> {
      const [row] = await db.select().from(user).where(eq(user.discordId, discordId)).limit(1);
      return row;
    },

    /** Snowflake do Discord vinculado ao usuário (via tabela `account`). */
    async findDiscordAccountId(userId: string): Promise<string | undefined> {
      const [row] = await db
        .select({ accountId: account.accountId })
        .from(account)
        .where(and(eq(account.userId, userId), eq(account.providerId, "discord")))
        .limit(1);
      return row?.accountId;
    },

    async setDiscordId(id: string, discordId: string): Promise<void> {
      await db.update(user).set({ discordId }).where(eq(user.id, id));
    },

    async listByRole(roles: readonly Role[]): Promise<UserRecord[]> {
      if (roles.length === 0) return [];
      return db.select().from(user).where(inArray(user.role, [...roles]));
    },

    async updateRole(id: string, role: Role): Promise<UserRecord | undefined> {
      const [row] = await db.update(user).set({ role }).where(eq(user.id, id)).returning();
      return row;
    },
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
