import { validateEnv } from '@constatic/base';
import { z } from 'zod';

export const env = await validateEnv(z.looseObject({
    BOT_TOKEN: z.string("Discord Bot Token is required").min(1),
    WEBHOOK_LOGS_URL: z.url().optional(),
    GUILD_ID: z.string().optional(),
    DATABASE_URL: z.string("Database URL is required").min(1),
    BETTER_AUTH_SECRET: z.string("Better Auth Secret is required").min(1),
    DISCORD_CLIENT_ID: z.string("Discord Client ID is required").min(1),
    DISCORD_CLIENT_SECRET: z.string("Discord Client Secret is required").min(1),
}));