import { PartialType } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto.js";
import { IsBoolean, IsOptional, IsString, Length } from "class-validator";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @Length(1, 30)
  override firstName?: string;
  @IsOptional()
  @IsString()
  @Length(1, 30)
  override lastName?: string;
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
