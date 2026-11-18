import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { StringValue } from "ms";
import { RegisterUserDto } from "../users/dto/user.dto.js";
import { User } from "../users/entities/user.entity.js";
import { UsersService } from "../users/users.service.js";
import { EmailService } from "./email/email.service.js";
import { RefreshTokensService } from "./refresh-tokens/refresh-tokens.service.js";
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly refreshTokensService: RefreshTokensService,
  ) {}
  generateEmailVerificationToken(user: User): string {
    const payload = { type: "email_verification", sub: user.id };
    return this.jwtService.sign(payload, {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      expiresIn: this.configService.get<string>("EMAIL_VERIFICATION_EXPIRES_IN") as StringValue,
      secret: this.configService.get<string>("EMAIL_VERIFICATION_SECRET"),
    });
  }
  async register(registerUserDto: RegisterUserDto): Promise<string> {
    const { password } = registerUserDto;
    if (Buffer.byteLength(password, "utf-8") > 72) {
      throw new BadRequestException("Password is too long");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const userWithHashedPassword = Object.assign(new RegisterUserDto(), registerUserDto, {
      password: hashedPassword,
    });
    const user = await this.usersService.create(userWithHashedPassword);
    const verificationToken = this.generateEmailVerificationToken(user);
    await this.emailService.sendVerificationEmail(user.email, verificationToken);
    return "check your email for verification link";
  }
  async verifyEmail(token: string): Promise<string> {
    try {
      const payload: { type: string; sub: number } = this.jwtService.verify(token, {
        secret: this.configService.get<string>("EMAIL_VERIFICATION_SECRET"),
      });
      if (payload.type !== "email_verification") {
        throw new UnauthorizedException("Invalid token type");
      }
      const user = await this.usersService.findOne({ id: payload.sub });
      if (!user) {
        throw new UnauthorizedException("User not found");
      }
      await this.usersService.update(user.id, { isVerified: true });
      return "Email verified successfully";
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
  async resendVerificationEmail(email: string): Promise<string> {
    const user = await this.usersService.findOne({ email });
    const verificationText =
      "If the account exists and is not verified, a verification email has been sent.";
    if (!user) {
      return verificationText;
    }
    if (user.isVerified) {
      return verificationText;
    }
    const verificationToken = this.generateEmailVerificationToken(user);
    await this.emailService.sendVerificationEmail(user.email, verificationToken);
    return verificationText;
  }
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOne({ email: email });
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return null;
    }
    return user;
  }
  async login(user: User): Promise<{ access_token: string; refresh_token: string }> {
    const payload = { sub: user.id };
    const refreshToken = await this.refreshTokensService.create(user.id);
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
    };
  }
  async refresh(oldRefreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const { refreshToken, userId } = await this.refreshTokensService.refresh(oldRefreshToken);
    const payload = { sub: userId };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
    };
  }
  logout(refreshToken: string) {
    return this.refreshTokensService.delete(refreshToken);
  }
  logoutAll(userId: number) {
    return this.refreshTokensService.deleteAllForUser(userId);
  }
}
