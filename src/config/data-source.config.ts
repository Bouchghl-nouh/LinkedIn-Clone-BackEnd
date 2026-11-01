import { config } from "dotenv";
import { resolve } from "node:path";
import { DataSource } from "typeorm";

const environment = process.env.NODE_ENV ?? "development";

if (!["development", "test", "production"].includes(environment)) {
  throw new Error(`Invalid NODE_ENV: ${environment}`);
}

if (environment !== "production") {
  const envFilePath = resolve(process.cwd(), `.env.${environment}`);
  const result = config({ path: envFilePath });

  if (result.error) {
    throw new Error(`Failed to load ${envFilePath}`, {
      cause: result.error,
    });
  }
}

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? "5432", 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/migrations/*.ts"],
});
