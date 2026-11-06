import { Controller, Body, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { CreateUserDto } from "../users/dto/create-user.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("register")
  async register(@Body() createUserDto: CreateUserDto): Promise<{ message: string }> {
    const verificationMessage = await this.authService.register(createUserDto);
    return { message: verificationMessage };
  }
}
