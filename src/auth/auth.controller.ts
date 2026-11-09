import { Controller, Body, Post,Query } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { CreateUserDto } from "../users/dto/create-user.dto.js";
import { Throttle } from "@nestjs/throttler";
import {EmailDto} from "./dto/email.dto.js"
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("register")
  async register(@Body() createUserDto: CreateUserDto): Promise<{ message: string }> {
    const verificationMessage = await this.authService.register(createUserDto);
    return { message: verificationMessage };
  }
  @Post("verify-email")
  async verifyEmail(@Query("token") token: string) {
    const verificationMessage = await this.authService.verifyEmail(token);
    return { message: verificationMessage };
  }
  @Post("resend-verification-email")
  async resendVerificationEmail(@Body() resendDto: EmailDto) {
    const verificationMessage = await this.authService.resendVerificationEmail(resendDto.email);
    return { message: verificationMessage };
  }
}
