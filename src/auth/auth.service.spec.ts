import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service.js";
import { UsersService } from "../users/users.service.js";
import { EmailService } from "./email/email.service.js";
import { BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { RefreshTokensService } from "./refresh-tokens/refresh-tokens.service.js";
describe("AuthService", () => {
  let service: AuthService;
  const mockUsersService = {
    create: vi.fn(),
  };
  const mockEmailService = {
    sendVerificationEmail: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: { get: vi.fn() } },
        { provide: RefreshTokensService, useValue: { createRefreshToken: vi.fn() } },
        JwtService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
  describe("register", () => {
    it("shouldn't accept password longer than 72 characters", async () => {
      const registerUserDto = {
        email: "test@test.com",
        password: "a".repeat(73),
        firstName: "Test",
        lastName: "User",
      };
      await expect(service.register(registerUserDto)).rejects.toThrow(BadRequestException);
    });
  });
});
