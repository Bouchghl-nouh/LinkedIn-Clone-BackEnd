import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import bcrypt from "bcrypt";
import { DataSource } from "typeorm";
import { AppModule } from "../app.module.js";
import { User } from "../users/entities/user.entity.js";
import { UsersService } from "../users/users.service.js";
import { AuthService } from "./auth.service.js";
import { EmailService } from "./email/email.service.js";
import { RefreshToken } from "./refresh-tokens/entities/refresh-token.entity.js";
import { RefreshTokensService } from "./refresh-tokens/refresh-tokens.service.js";
import { PasswordToken } from "./password-tokens/entities/password-token.entity.js";
import { PasswordTokensService } from "./password-tokens/password-tokens.service.js";

const uniqueEmail = (label: string) =>
  `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

describe("auth service (integration)", () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let authService: AuthService;
  let usersService: UsersService;
  let refreshTokensService: RefreshTokensService;
  let passwordTokensService: PasswordTokensService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const emailService = {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
  };

  const resetDatabase = async () => {
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(emailService)
      .compile();

    dataSource = module.get(DataSource);
    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    refreshTokensService = module.get(RefreshTokensService);
    passwordTokensService = module.get(PasswordTokensService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await module.close();
  });

  it("registers a user with a hashed password and sends verification email", async () => {
    const email = uniqueEmail("register");

    const message = await authService.register({
      email,
      password: "Password123!",
      firstName: "Auth",
      lastName: "User",
    });

    const user = await usersService.findOne({ email });
    expect(message).toBe("check your email for verification link");
    expect(user).not.toBeNull();
    expect(user?.isVerified).toBe(false);
    expect(await bcrypt.compare("Password123!", user!.password)).toBe(true);
    expect(emailService.sendVerificationEmail).toHaveBeenCalledOnce();
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(email, expect.any(String));
  });

  it("rejects passwords longer than 72 UTF-8 bytes", async () => {
    await expect(
      authService.register({
        email: uniqueEmail("long-password"),
        password: "é".repeat(37),
        firstName: "Auth",
        lastName: "User",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("validates a user by email and bcrypt password", async () => {
    const email = uniqueEmail("validate");
    await authService.register({
      email,
      password: "Password123!",
      firstName: "Auth",
      lastName: "User",
    });

    await expect(authService.validateUser(email, "Password123!")).resolves.toMatchObject({
      email,
      isVerified: false,
    });
    await expect(authService.validateUser(email, "WrongPassword123!")).resolves.toBeNull();
    await expect(
      authService.validateUser("missing@example.com", "Password123!"),
    ).resolves.toBeNull();
  });

  it("rejects validation for passwords longer than 72 UTF-8 bytes", async () => {
    const email = uniqueEmail("validate-long");
    await authService.register({
      email,
      password: "Password123!",
      firstName: "Auth",
      lastName: "User",
    });
    await expect(authService.validateUser(email, "x".repeat(73))).resolves.toBeNull();
  });

  it("logs in a user and creates access and refresh tokens", async () => {
    const email = uniqueEmail("login");
    const user = await usersService.create({
      email,
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });

    const tokens = await authService.login(user);

    expect(tokens.access_token).toEqual(expect.any(String));
    expect(tokens.refresh_token).toMatch(/^[a-f0-9]{128}$/);
    await expect(
      dataSource.getRepository(RefreshToken).count({ where: { userId: user.id } }),
    ).resolves.toBe(1);
  });

  it("verifies email with a generated verification token", async () => {
    const email = uniqueEmail("verify");
    const user = await usersService.create({
      email,
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });
    const token = authService.generateEmailVerificationToken(user);

    await expect(authService.verifyEmail(token)).resolves.toBe("Email verified successfully");
    await expect(usersService.findOne({ id: user.id })).resolves.toMatchObject({
      isVerified: true,
    });
  });

  it("rejects invalid verification token types", async () => {
    await expect(authService.verifyEmail("not-a-jwt")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects verification tokens with the wrong type or unknown user", async () => {
    const secret = configService.get<string>("EMAIL_VERIFICATION_SECRET");
    const wrongTypeToken = jwtService.sign({ type: "access", sub: 999999 }, { secret });
    const unknownUserToken = jwtService.sign(
      { type: "email_verification", sub: 999999 },
      { secret },
    );

    await expect(authService.verifyEmail(wrongTypeToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(authService.verifyEmail(unknownUserToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("allows only one concurrent registration for the same email", async () => {
    const email = uniqueEmail("concurrent-register");
    const registration = {
      email,
      password: "Password123!",
      firstName: "Auth",
      lastName: "User",
    };

    const results = await Promise.allSettled([
      authService.register(registration),
      authService.register(registration),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    await expect(dataSource.getRepository(User).count({ where: { email } })).resolves.toBe(1);
    expect(results.some((result) => result.status === "rejected")).toBe(true);
  });

  it("resends verification only for an existing unverified user", async () => {
    const email = uniqueEmail("resend");
    const user = await usersService.create({
      email,
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });

    await expect(authService.resendVerificationEmail(email)).resolves.toBe(
      "If the account exists and is not verified, a verification email has been sent.",
    );
    expect(emailService.sendVerificationEmail).toHaveBeenCalledOnce();

    await usersService.update(user.id, { isVerified: true });
    vi.clearAllMocks();
    await expect(authService.resendVerificationEmail(email)).resolves.toContain(
      "If the account exists",
    );
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();

    await expect(authService.resendVerificationEmail(uniqueEmail("missing"))).resolves.toContain(
      "If the account exists",
    );
  });

  it("forgets an existing password without revealing whether an account exists", async () => {
    const email = uniqueEmail("forget");
    await usersService.create({
      email,
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });

    await expect(authService.forgetPassword(email)).resolves.toBe(
      "If the account exists, a password reset email has been sent.",
    );
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledOnce();
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      email,
      expect.stringMatching(/^[a-f0-9]{128}$/),
    );

    vi.clearAllMocks();
    await expect(authService.forgetPassword(uniqueEmail("missing"))).resolves.toBe(
      "If the account exists, a password reset email has been sent.",
    );
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("rejects weak and overly long replacement passwords", async () => {
    await expect(authService.resetPassword("unknown-token", "é".repeat(37))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects expired password reset tokens", async () => {
    const user = await usersService.create({
      email: uniqueEmail("expired-reset"),
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });
    const token = await passwordTokensService.create(user.id);
    const passwordToken = await dataSource
      .getRepository(PasswordToken)
      .findOneOrFail({ where: { userId: user.id } });
    passwordToken.expiresAt = new Date(Date.now() - 60_000);
    await dataSource.getRepository(PasswordToken).save(passwordToken);

    await expect(authService.resetPassword(token, "NewPassword123!")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects password reset tokens that do not exist", async () => {
    await expect(
      authService.resetPassword("not-a-real-token", "NewPassword123!"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("resets a password and invalidates the reset token and all refresh sessions", async () => {
    const user = await usersService.create({
      email: uniqueEmail("successful-reset"),
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });
    const resetToken = await passwordTokensService.create(user.id);
    await refreshTokensService.create(user.id);
    await refreshTokensService.create(user.id);

    await expect(authService.resetPassword(resetToken, "NewPassword123!")).resolves.toBe(
      "Password reset successfully",
    );

    const updatedUser = await usersService.findOne({ id: user.id });
    expect(updatedUser).not.toBeNull();
    expect(await bcrypt.compare("NewPassword123!", updatedUser!.password)).toBe(true);
    await expect(
      dataSource.getRepository(PasswordToken).count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
    await expect(
      dataSource.getRepository(RefreshToken).count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
  });

  it("allows only one concurrent password reset for the same token", async () => {
    const user = await usersService.create({
      email: uniqueEmail("concurrent-reset"),
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });
    const resetToken = await passwordTokensService.create(user.id);
    await refreshTokensService.create(user.id);

    const results = await Promise.allSettled([
      authService.resetPassword(resetToken, "FirstPassword123!"),
      authService.resetPassword(resetToken, "SecondPassword123!"),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    await expect(
      dataSource.getRepository(PasswordToken).count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
    await expect(
      dataSource.getRepository(RefreshToken).count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
  });

  it("refreshes access and refresh tokens", async () => {
    const user = await usersService.create({
      email: uniqueEmail("refresh"),
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });
    const oldRefreshToken = await refreshTokensService.create(user.id);

    const result = await authService.refresh(oldRefreshToken);

    expect(result.access_token).toEqual(expect.any(String));
    expect(result.refresh_token).not.toBe(oldRefreshToken);
    await expect(authService.refresh(oldRefreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("allows only one concurrent auth refresh and invalidates the replayed token", async () => {
    const user = await usersService.create({
      email: uniqueEmail("concurrent-refresh"),
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });
    const oldRefreshToken = await refreshTokensService.create(user.id);

    const results = await Promise.allSettled([
      authService.refresh(oldRefreshToken),
      authService.refresh(oldRefreshToken),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    await expect(authService.refresh(oldRefreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      dataSource.getRepository(RefreshToken).count({ where: { userId: user.id } }),
    ).resolves.toBe(1);
  });

  it("keeps sessions isolated until logout-all invalidates every session", async () => {
    const user = await usersService.create({
      email: uniqueEmail("session-isolation"),
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });
    const firstSession = await authService.login(user);
    const secondSession = await authService.login(user);

    await expect(
      dataSource.getRepository(RefreshToken).count({ where: { userId: user.id } }),
    ).resolves.toBe(2);

    await authService.logoutAll(user.id);

    await expect(authService.refresh(firstSession.refresh_token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(authService.refresh(secondSession.refresh_token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("logs out one session and all sessions", async () => {
    const firstUser = await usersService.create({
      email: uniqueEmail("logout-first"),
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });
    const secondUser = await usersService.create({
      email: uniqueEmail("logout-second"),
      password: await bcrypt.hash("Password123!", 10),
      firstName: "Auth",
      lastName: "User",
    });
    const firstToken = await refreshTokensService.create(firstUser.id);
    await refreshTokensService.create(firstUser.id);
    await refreshTokensService.create(secondUser.id);

    await authService.logout(firstToken);
    await expect(
      dataSource.getRepository(RefreshToken).count({ where: { userId: firstUser.id } }),
    ).resolves.toBe(1);

    await authService.logoutAll(firstUser.id);
    await expect(
      dataSource.getRepository(RefreshToken).count({ where: { userId: firstUser.id } }),
    ).resolves.toBe(0);
    await expect(
      dataSource.getRepository(RefreshToken).count({ where: { userId: secondUser.id } }),
    ).resolves.toBe(1);
  });
});
