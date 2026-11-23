import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import ms, { StringValue } from "ms";
import { TokenService } from "../../common/token/token.service.js";
import { EntityManager, Repository } from "typeorm";
import { PasswordToken } from "./entities/password-token.entity.js";

@Injectable()
export class PasswordTokensService {
  constructor(
    @InjectRepository(PasswordToken)
    private readonly passwordTokenRepository: Repository<PasswordToken>,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {}

  generatePasswordToken(): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const expiresIn = this.configService.getOrThrow<StringValue>("PASSWORD_TOKEN_EXPIRES_IN");
    return this.tokenService.generateWithExpiration(ms(expiresIn));
  }

  async create(userId: number): Promise<string> {
    await this.passwordTokenRepository.delete({ userId });
    const { rawToken, tokenHash, expiresAt } = this.generatePasswordToken();
    const passwordToken = this.passwordTokenRepository.create({
      tokenHash,
      userId,
      expiresAt,
    });
    await this.passwordTokenRepository.save(passwordToken);
    return rawToken;
  }

  async validate(token: string, manager?: EntityManager): Promise<PasswordToken | null> {
    const repository = manager
      ? manager.getRepository(PasswordToken)
      : this.passwordTokenRepository;
    const hashedToken = this.tokenService.hash(token);
    const passwordToken = await repository.findOne({
      where: { tokenHash: hashedToken },
      ...(manager && { lock: { mode: "pessimistic_write" } }),
    });
    if (!passwordToken || passwordToken.expiresAt < new Date()) {
      return null;
    }
    return passwordToken;
  }
  async delete(id: number, manager?: EntityManager): Promise<void> {
    const repository = manager
      ? manager.getRepository(PasswordToken)
      : this.passwordTokenRepository;
    await repository.delete({ id });
  }
}
