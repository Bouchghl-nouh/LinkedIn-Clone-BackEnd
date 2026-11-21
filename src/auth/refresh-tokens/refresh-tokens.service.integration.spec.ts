import { UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AppModule } from "../../app.module.js";
import { TokenService } from "../../common/token/token.service.js";
import { User } from "../../users/entities/user.entity.js";
import { RefreshToken } from "./entities/refresh-token.entity.js";
import { RefreshTokensService } from "./refresh-tokens.service.js";

describe("refresh tokens (integration)", () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let refreshTokensService: RefreshTokensService;
  let tokenService: TokenService;

  const resetDatabase = async () => {
    await dataSource.query('TRUNCATE TABLE "refresh_tokens" RESTART IDENTITY CASCADE');
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  };

  const createUser = async (suffix = Date.now()) =>
    dataSource.getRepository(User).save({
      email: `refresh-token-${suffix}-${Math.random()}@example.com`,
      password: "password123",
      firstName: "Refresh",
      lastName: "Token",
    });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    dataSource = module.get(DataSource);
    refreshTokensService = module.get(RefreshTokensService);
    tokenService = module.get(TokenService);
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await module.close();
  });

  it("generates a raw token, its hash, and an expiry", () => {
    const before = Date.now();
    const generated = refreshTokensService.generateRefreshToken();

    expect(generated.rawToken).toMatch(/^[a-f0-9]{128}$/);
    expect(generated.tokenHash).toBe(tokenService.hash(generated.rawToken));
    expect(generated.expiresAt.getTime()).toBeGreaterThan(before);
  });

  it("creates and persists a refresh token for a user", async () => {
    const user = await createUser();
    const before = Date.now();
    const rawToken = await refreshTokensService.create(user.id);

    const stored = await dataSource.getRepository(RefreshToken).findOne({
      where: { userId: user.id },
    });

    expect(rawToken).toBeDefined();
    expect(stored).not.toBeNull();
    expect(stored?.tokenHash).toBe(tokenService.hash(rawToken));
    expect(stored?.tokenHash).not.toBe(rawToken);
    expect(stored?.expiresAt.getTime()).toBeGreaterThan(before);
  });

  it("rotates a valid refresh token and preserves the user", async () => {
    const user = await createUser();
    const oldRawToken = await refreshTokensService.create(user.id);
    const repository = dataSource.getRepository(RefreshToken);

    const rotated = await refreshTokensService.refresh(oldRawToken);

    expect(rotated.userId).toBe(user.id);
    expect(rotated.refreshToken).not.toBe(oldRawToken);
    expect(
      await repository.findOne({ where: { tokenHash: tokenService.hash(oldRawToken) } }),
    ).toBeNull();

    const newStoredToken = await repository.findOne({
      where: { tokenHash: tokenService.hash(rotated.refreshToken) },
    });
    expect(newStoredToken).not.toBeNull();
    expect(newStoredToken?.userId).toBe(user.id);
  });

  it("rejects an unknown refresh token", async () => {
    await expect(refreshTokensService.refresh("unknown-refresh-token")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects and removes no state for an expired refresh token", async () => {
    const user = await createUser();
    const rawToken = await refreshTokensService.create(user.id);
    const repository = dataSource.getRepository(RefreshToken);

    await repository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where({ tokenHash: tokenService.hash(rawToken) })
      .execute();

    await expect(refreshTokensService.refresh(rawToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("does not allow a rotated refresh token to be reused", async () => {
    const user = await createUser();
    const firstRawToken = await refreshTokensService.create(user.id);
    await refreshTokensService.refresh(firstRawToken);

    await expect(refreshTokensService.refresh(firstRawToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    const storedTokens = await dataSource.getRepository(RefreshToken).find({
      where: { userId: user.id },
    });
    expect(storedTokens).toHaveLength(1);
  });

  it("allows only one concurrent refresh request to succeed", async () => {
    const user = await createUser();
    const rawToken = await refreshTokensService.create(user.id);

    const results = await Promise.allSettled([
      refreshTokensService.refresh(rawToken),
      refreshTokensService.refresh(rawToken),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(
      await dataSource.getRepository(RefreshToken).find({ where: { userId: user.id } }),
    ).toHaveLength(1);
  });

  it("deletes a refresh token by its raw value", async () => {
    const user = await createUser();
    const rawToken = await refreshTokensService.create(user.id);

    const result = await refreshTokensService.delete(rawToken);

    expect(result.affected).toBe(1);
    expect(
      await dataSource
        .getRepository(RefreshToken)
        .findOne({ where: { tokenHash: tokenService.hash(rawToken) } }),
    ).toBeNull();
  });

  it("deletes all refresh tokens belonging to one user", async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();
    await refreshTokensService.create(firstUser.id);
    await refreshTokensService.create(firstUser.id);
    await refreshTokensService.create(secondUser.id);

    const result = await refreshTokensService.deleteAllForUser(firstUser.id);

    expect(result.affected).toBe(2);
    expect(
      await dataSource.getRepository(RefreshToken).count({ where: { userId: firstUser.id } }),
    ).toBe(0);
    expect(
      await dataSource.getRepository(RefreshToken).count({ where: { userId: secondUser.id } }),
    ).toBe(1);
  });
});
