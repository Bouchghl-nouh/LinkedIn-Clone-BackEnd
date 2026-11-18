import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service.js";
import { User } from "../../users/entities/user.entity.js";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: "email" });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException("Invalid Credentials");
    }
    if (!user.isVerified) {
      throw new ForbiddenException("Email not verified");
    }
    return user;
  }
}
