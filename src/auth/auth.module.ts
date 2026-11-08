import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { UsersModule } from "../users/users.module.js";
import { JwtModule } from "@nestjs/jwt";
import { StringValue } from "ms";
import { EmailService } from "./email/email.service.js";
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          expiresIn: (configService.get<string>("JWT_EXPIRES_IN") || "1h") as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService],
})
export class AuthModule {}
