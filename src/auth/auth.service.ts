import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "../users/dto/create-user.dto.js";
import bcrypt from "bcrypt";
import { UsersService } from "../users/users.service.js";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { User } from "../users/entities/user.entity.js";
import { StringValue } from "ms";
import { EmailService } from "./email/email.service.js";
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}
  async register(createUserDto: CreateUserDto): Promise<string> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const userWithHashedPassword = Object.assign(new CreateUserDto(), createUserDto, {
      password: hashedPassword,
    });
    const user = await this.usersService.create(userWithHashedPassword);
    const verificationToken = this.generateEmailVerificationToken(user);
    await this.emailService.sendVerificationEmail(user.email, verificationToken);
    return "check your email for verification link";
  }
  generateEmailVerificationToken(user: User): string {
    const payload = { type: "email_verification", sub: user.id };
    return this.jwtService.sign(payload, {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      expiresIn: this.configService.get<string>("EMAIL_VERIFICATION_EXPIRES_IN") as StringValue,
      secret: this.configService.get<string>("EMAIL_VERIFICATION_SECRET"),
    });
  }
}
