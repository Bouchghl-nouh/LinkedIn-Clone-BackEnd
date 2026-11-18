import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { UsersModule } from "../users/users.module.js";
import { JwtModule } from "@nestjs/jwt";
import { StringValue } from "ms";
import { EmailService } from "./email/email.service.js";
import { RefreshTokensService } from "./refresh-tokens/refresh-tokens.service.js";
import { RefreshToken } from "./refresh-tokens/entities/refresh-token.entity.js";
import { TokenModule } from "../common/token/token.module.js";
import { LocalStrategy } from "./strategies/local.strategy.js";
import { JwtStrategy } from "./strategies/jwt.strategy.js";
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.getOrThrow<StringValue>("JWT_EXPIRES_IN"),
        },
      }),
    }),
    TypeOrmModule.forFeature([RefreshToken]),
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, RefreshTokensService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
