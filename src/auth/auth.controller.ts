import { Controller, Body, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { CreateUserDto } from "../users/dto/create-user.dto.js";
import { Throttle } from "@nestjs/throttler";
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("register")
  async register(@Body() createUserDto: CreateUserDto): Promise<{ message: string }> {
    const verificationMessage = await this.authService.register(createUserDto);
    return { message: verificationMessage };
  }
}
