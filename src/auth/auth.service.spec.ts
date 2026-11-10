import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service.js";
import { UsersService } from "../users/users.service.js";
import { EmailService } from "./email/email.service.js";
import { JwtService } from "@nestjs/jwt";
describe("AuthService", () => {
  let service: AuthService;
  const mockUsersService = {
    create: vi.fn(),
  };
  const mockAuthService = {
    register: vi.fn(),
    generateEmailVerificationToken: vi.fn(),
  };
  const mockEmailService = {
    sendVerificationEmail: vi.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
        JwtService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
