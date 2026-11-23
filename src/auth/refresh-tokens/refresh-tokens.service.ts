import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import ms, { StringValue } from "ms";
import { TokenService } from "../../common/token/token.service.js";
import { DataSource, Repository, EntityManager } from "typeorm";
import { RefreshToken } from "./entities/refresh-token.entity.js";

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {}

  generateRefreshToken(): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const expiresIn = this.configService.getOrThrow<StringValue>("REFRESH_TOKEN_EXPIRES_IN");
    return this.tokenService.generateWithExpiration(ms(expiresIn));
  }

  async create(userId: number): Promise<string> {
    const { rawToken, tokenHash, expiresAt } = this.generateRefreshToken();
    const refreshToken = this.refreshTokenRepository.create({
      tokenHash,
      userId,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);
    return rawToken;
  }

  refresh(refreshToken: string): Promise<{ refreshToken: string; userId: number }> {
    const hashedRefreshToken = this.tokenService.hash(refreshToken);
    return this.dataSource.transaction(async (manager) => {
      const existingToken = await manager.findOne(RefreshToken, {
        where: { tokenHash: hashedRefreshToken },
        lock: { mode: "pessimistic_write" },
      });
      if (!existingToken || existingToken.expiresAt < new Date()) {
        throw new UnauthorizedException("Invalid refresh token");
      }
      await manager.delete(RefreshToken, { id: existingToken.id });
      const { rawToken, tokenHash: newTokenHash, expiresAt } = this.generateRefreshToken();
      const tokenEntity = manager.create(RefreshToken, {
        tokenHash: newTokenHash,
        userId: existingToken.userId,
        expiresAt,
      });
      await manager.save(tokenEntity);
      return { refreshToken: rawToken, userId: existingToken.userId };
    });
  }

  delete(refreshToken: string) {
    const tokenHash = this.tokenService.hash(refreshToken);
    return this.refreshTokenRepository.delete({ tokenHash });
  }

  deleteAllForUser(userId: number, manager?: EntityManager) {
    const repository = manager ? manager.getRepository(RefreshToken) : this.refreshTokenRepository;
    return repository.delete({ userId });
  }
}
