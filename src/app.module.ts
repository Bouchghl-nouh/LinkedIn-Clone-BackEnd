import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AuthModule } from "./auth/auth.module.js";
import { createDatabaseConfig } from "./config/database.config.js";
import { UsersModule } from "./users/users.module.js";
const environment = process.env.NODE_ENV || "development";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [`.env.${environment}`, ".env"],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createDatabaseConfig,
    }),
    ThrottlerModule.forRoot({
      errorMessage: "You have exceeded the rate limit. Please try again later.",
      throttlers: [
        {
          ttl: 60000,
          limit: 50,
        },
      ],
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
