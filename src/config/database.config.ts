import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const createDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: "postgres",
  host: configService.get<string>("DB_HOST"),
  port: parseInt(configService.get<string>("DB_PORT") ?? "5432", 10),
  username: configService.get<string>("DB_USER"),
  password: configService.get<string>("DB_PASSWORD"),
  database: configService.get<string>("DB_DATABASE"),
  autoLoadEntities: true,
  synchronize: configService.get<string>("NODE_ENV") === "test",
  retryAttempts: 20,
  retryDelay: 5000,
});
