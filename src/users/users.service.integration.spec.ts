// import { ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AppModule } from "../app.module.js";
import { UsersService } from "./users.service.js";

describe("users (integration)", () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let usersService: UsersService;

  const resetDatabase = async () => {
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    dataSource = module.get(DataSource);
    usersService = module.get(UsersService);
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await module.close();
  });

  it("should create and fetch a user", async () => {
    const unique = Date.now();
    const email = `user-${unique}@example.com`;

    const created = await usersService.create({
      email,
      password: "password123",
      firstName: "Test",
      lastName: "User",
    });

    expect(created.id).toBeDefined();
    expect(created.email).toBe(email);

    const fetched = await usersService.findOne({ id: created.id });
    expect(fetched).not.toBeNull();
    expect(fetched?.email).toBe(email);
  });

  it("should throw ConflictException for duplicate email", async () => {
    const unique = Date.now();
    const email = `duplicate-${unique}@example.com`;

    await usersService.create({
      email,
      password: "password123",
      firstName: "Test",
      lastName: "User",
    });

    await expect(
      usersService.create({
        email,
        password: "password123",
        firstName: "Test",
        lastName: "User",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
