import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBody } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import ms, { StringValue } from "ms";
import { ApiResponseWrapper } from "../common/decorators/api-response.decorator.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import type { RequestWithCookies } from "../common/types/cookies-request.type.js";
import { LoginUserDto, RegisterUserDto } from "../users/dto/user.dto.js";
import { User } from "../users/entities/user.entity.js";
import { AuthService } from "./auth.service.js";
import { AccessTokenResponseDto } from "./dto/access_token-response.dto.js";
import { EmailDto } from "./dto/email.dto.js";
import { JwtAuthGuard } from "./guards/jwt.auth.guard.js";
import { LocalAuthGuard } from "./guards/local-auth.guard.js";
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const expiresIn = this.configService.getOrThrow<StringValue>("REFRESH_TOKEN_EXPIRES_IN");
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>("NODE_ENV") === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ms(expiresIn),
    });
  }
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
  @Post("login")
  @ApiResponseWrapper({ dataDto: AccessTokenResponseDto })
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginUserDto })
  async login(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    const { access_token, refresh_token } = await this.authService.login(user);
    this.setRefreshTokenCookie(res, refresh_token);
    return {
      message: "Login successful",
      data: {
        access_token,
      },
    };
  }
  @Post("refresh")
  @ApiResponseWrapper({ dataDto: AccessTokenResponseDto })
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: RequestWithCookies, @Res({ passthrough: true }) res: Response) {
    const oldRefreshToken = req.cookies["refresh_token"];
    if (typeof oldRefreshToken !== "string" || oldRefreshToken.length === 0) {
      throw new UnauthorizedException("No refresh token provided");
    }
    const { access_token, refresh_token } = await this.authService.refresh(oldRefreshToken);
    this.setRefreshTokenCookie(res, refresh_token);
    return {
      message: "Token refreshed successfully",
      data: {
        access_token,
      },
    };
  }
  @Post("logout")
  @ApiResponseWrapper()
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: RequestWithCookies, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies["refresh_token"];
    if (typeof refreshToken === "string" && refreshToken.length > 0) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie("refresh_token", { path: "/" });

    return { message: "Logout successful" };
  }
  @Post("logout-all")
  @ApiResponseWrapper()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser("id") userId: number, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAll(userId);
    res.clearCookie("refresh_token", { path: "/" });
    return { message: "All sessions logged out successfully" };
  }
}
