import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const environment = process.env.NODE_ENV ?? "test";
const envFilePath = resolve(process.cwd(), `.env.${environment}`);

if (environment !== "test") {
  throw new Error(`Integration tests must run with NODE_ENV=test, received ${environment}`);
}

const result = loadEnv({ path: envFilePath });

if (result.error) {
  throw new Error(`Failed to load ${envFilePath}`, { cause: result.error });
}

const databaseName = process.env.DB_DATABASE;

if (!databaseName || !/(^|[_-])test$/.test(databaseName)) {
  throw new Error(
    `Refusing to run integration tests against database ${databaseName ?? "<undefined>"}. ` +
      'Set DB_DATABASE in .env.test to a database ending in "_test".',
  );
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: "./",
    include: ["**/*.integration.spec.ts"],
  },
});
