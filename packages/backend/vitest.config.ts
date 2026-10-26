import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: "./",
    include: ["src/**/*.spec.ts"],
    env: {
      DATABASE_URL: "postgres://u:p@localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-123",
      DISCORD_CLIENT_ID: "1",
      DISCORD_CLIENT_SECRET: "x",
    },
  },
});
