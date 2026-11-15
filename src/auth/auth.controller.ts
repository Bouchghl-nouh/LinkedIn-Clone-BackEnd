import { Body, Controller, Get, HttpStatus, Post, Query, HttpCode } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RegisterUserDto } from "../users/dto/user.dto.js";
import { AuthService } from "./auth.service.js";
import { EmailDto } from "./dto/email.dto.js";
import { ApiResponseWrapper } from "../common/decorators/api-reponse.decorator.js";
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("register")
  @ApiResponseWrapper({ status: HttpStatus.CREATED })
  async register(@Body() registerUser: RegisterUserDto): Promise<{ message: string }> {
    const verificationMessage = await this.authService.register(registerUser);
    return { message: verificationMessage };
  }
  @Get("verify-email")
  @ApiResponseWrapper()
  async verifyEmail(@Query("token") token: string) {
    const verificationMessage = await this.authService.verifyEmail(token);
    return { message: verificationMessage };
  }
  @Post("resend-verification-email")
  @HttpCode(HttpStatus.OK)
  @ApiResponseWrapper({ status: HttpStatus.OK })
  async resendVerificationEmail(@Body() resendDto: EmailDto) {
    const verificationMessage = await this.authService.resendVerificationEmail(resendDto.email);
    return { message: verificationMessage };
  }
}
