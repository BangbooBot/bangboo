/**
 * Tabelas exigidas pelo Better Auth (+ plugin JWT) com as extensões do projeto
 * (`user.role`, `user.discordId`).
 *
 * Mantenha em sincronia com `bun run auth:schema` (CLI do Better Auth) quando
 * atualizar a biblioteca ou adicionar plugins.
 */
import { relations, sql } from "drizzle-orm";
import { boolean, check, index, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { Role } from "../../rbac/role.js";
import { tstz } from "./columns.js";
import { roleEnum } from "./enums.js";
import { dbSchema } from "./pg-schema.js";

const uuidV7 = sql`uuidv7()`; // requer PostgreSQL 18+

export const user = dbSchema.table(
  "user",
  {
    id: uuid("id").primaryKey().default(uuidV7),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    /** Snowflake do Discord. Chave de ligação entre o dashboard e o bot. */
    discordId: text("discord_id").unique(),
    role: roleEnum("role").default(Role.USER).notNull(),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [check("user_discord_id_format_chk", sql`${table.discordId} ~ '^[0-9]{17,20}$'`)],
);

export const session = dbSchema.table(
  "session",
  {
    id: uuid("id").primaryKey().default(uuidV7),
    expiresAt: tstz("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    // limpeza periódica de sessões expiradas
    index("session_expires_at_idx").on(table.expiresAt),
  ],
);

export const account = dbSchema.table(
  "account",
  {
    id: uuid("id").primaryKey().default(uuidV7),
    /** ID do usuário NO provedor (para o Discord, o snowflake). */
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: tstz("access_token_expires_at"),
    refreshTokenExpiresAt: tstz("refresh_token_expires_at"),
    scope: text("scope"),
    /** Parte do modelo core do Better Auth (validado no boot). Não usado: login é só via Discord. */
    password: text("password"),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    // uma conta de provedor só pode estar vinculada a UM usuário
    uniqueIndex("account_provider_account_uidx").on(table.providerId, table.accountId),
  ],
);

export const verification = dbSchema.table(
  "verification",
  {
    id: uuid("id").primaryKey().default(uuidV7),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: tstz("expires_at").notNull(),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("verification_identifier_idx").on(table.identifier),
    index("verification_expires_at_idx").on(table.expiresAt),
  ],
);

/** Chaves de assinatura do JWT (plugin `jwt`). A chave privada é guardada criptografada. */
export const jwks = dbSchema.table("jwks", {
  id: uuid("id").primaryKey().default(uuidV7),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  alg: text("alg"),
  crv: text("crv"),
  createdAt: tstz("created_at").defaultNow().notNull(),
  expiresAt: tstz("expires_at"),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));
