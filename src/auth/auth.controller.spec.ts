import { UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import express from "express";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { ConfigService } from "@nestjs/config";
import { User } from "../users/entities/user.entity.js";
import type { RequestWithCookies } from "../common/types/cookies-request.type.js";

const createCookieRequest = (cookies: Record<string, string | undefined>): RequestWithCookies => {
  return Object.assign(express.request, { cookies });
};

const createMockResponse = () => {
  const cookie = vi.fn();
  const clearCookie = vi.fn();
  const response = Object.assign(express.response, { cookie, clearCookie });
  return { response, cookie, clearCookie };
};

describe("AuthController", () => {
  let controller: AuthController;
  const mockAuthService = {
    register: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerificationEmail: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
  };
  const mockConfigService = {
    getOrThrow: vi.fn(() => "7d"),
    get: vi.fn((key: string): string | undefined => (key === "NODE_ENV" ? "test" : undefined)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) =>
      key === "NODE_ENV" ? "test" : undefined,
    );
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

  it("registers a user and wraps the verification message", async () => {
    const dto = {
      email: "auth@example.com",
      password: "Password123!",
      firstName: "Auth",
      lastName: "User",
    };
    mockAuthService.register.mockResolvedValue("check your email");

    await expect(controller.register(dto)).resolves.toEqual({
      message: "check your email",
    });
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
  });

  it("verifies an email token", async () => {
    mockAuthService.verifyEmail.mockResolvedValue("Email verified successfully");

    await expect(controller.verifyEmail("jwt-token")).resolves.toEqual({
      message: "Email verified successfully",
    });
    expect(mockAuthService.verifyEmail).toHaveBeenCalledWith("jwt-token");
  });

  it("resends a verification email", async () => {
    mockAuthService.resendVerificationEmail.mockResolvedValue("Check email");

    await expect(
      controller.resendVerificationEmail({ email: "auth@example.com" }),
    ).resolves.toEqual({ message: "Check email" });
    expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith("auth@example.com");
  });

  it("logs in a user, sets the refresh cookie, and returns the access token", async () => {
    const user = new User();
    user.id = 1;
    user.email = "auth@example.com";
    const { response, cookie } = createMockResponse();
    mockAuthService.login.mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });

    await expect(controller.login(user, response)).resolves.toEqual({
      message: "Login successful",
      data: { access_token: "access-token" },
    });
    expect(mockAuthService.login).toHaveBeenCalledWith(user);
    expect(cookie).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "strict",
        path: "/",
      }),
    );
  });

  it("marks the refresh cookie secure in production", async () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === "NODE_ENV" ? "production" : undefined,
    );
    const user = new User();
    user.id = 1;
    const { response, cookie } = createMockResponse();
    mockAuthService.login.mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });

    await controller.login(user, response);

    expect(cookie).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-token",
      expect.objectContaining({ secure: true, httpOnly: true }),
    );
  });

  it("rejects refresh requests without a refresh cookie", async () => {
    const { response } = createMockResponse();

    await expect(controller.refresh(createCookieRequest({}), response)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      controller.refresh(createCookieRequest({ refresh_token: "" }), response),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      controller.refresh(createCookieRequest({ refresh_token: undefined }), response),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refreshes tokens and sets the replacement cookie", async () => {
    const { response, cookie } = createMockResponse();
    mockAuthService.refresh.mockResolvedValue({
      access_token: "new-access",
      refresh_token: "new-refresh",
    });

    await expect(
      controller.refresh(createCookieRequest({ refresh_token: "old-refresh" }), response),
    ).resolves.toEqual({
      message: "Token refreshed successfully",
      data: { access_token: "new-access" },
    });
    expect(mockAuthService.refresh).toHaveBeenCalledWith("old-refresh");
    expect(cookie).toHaveBeenCalledWith("refresh_token", "new-refresh", expect.any(Object));
  });

  it("logs out a session and clears the refresh cookie", async () => {
    const { response, clearCookie } = createMockResponse();
    mockAuthService.logout.mockResolvedValue({ affected: 1 });

    await expect(
      controller.logout(createCookieRequest({ refresh_token: "refresh-token" }), response),
    ).resolves.toEqual({ message: "Logout successful" });
    expect(mockAuthService.logout).toHaveBeenCalledWith("refresh-token");
    expect(clearCookie).toHaveBeenCalledWith("refresh_token", { path: "/" });
  });

  it("logs out without calling auth service when no cookie exists", async () => {
    const { response, clearCookie } = createMockResponse();

    await expect(controller.logout(createCookieRequest({}), response)).resolves.toEqual({
      message: "Logout successful",
    });
    expect(mockAuthService.logout).not.toHaveBeenCalled();
    expect(clearCookie).toHaveBeenCalledWith("refresh_token", { path: "/" });
  });

  it("logs out all sessions and clears the refresh cookie", async () => {
    const { response, clearCookie } = createMockResponse();
    mockAuthService.logoutAll.mockResolvedValue({ affected: 2 });

    await expect(controller.logoutAll(42, response)).resolves.toEqual({
      message: "All sessions logged out successfully",
    });
    expect(mockAuthService.logoutAll).toHaveBeenCalledWith(42);
    expect(clearCookie).toHaveBeenCalledWith("refresh_token", { path: "/" });
  });
});
