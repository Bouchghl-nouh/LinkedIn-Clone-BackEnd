import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { ConfigService } from "@nestjs/config";
describe("AuthController", () => {
  let controller: AuthController;
  const mockAuthService = {
    register: vi.fn(),
  };
  const mockConfigService = {
    getOrThrow: vi.fn(),
    get: vi.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
