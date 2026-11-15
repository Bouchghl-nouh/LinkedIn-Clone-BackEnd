import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RegisterUserDto } from "../users/dto/user.dto.js";
import { AuthService } from "./auth.service.js";
import { EmailDto } from "./dto/email.dto.js";
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("register")
  async register(@Body() registerUser: RegisterUserDto): Promise<{ message: string }> {
    const verificationMessage = await this.authService.register(registerUser);
    return { message: verificationMessage };
  }
  @Get("verify-email")
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
