import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsBoolean,
  Length,
} from "class-validator";
import { OmitType, PartialType } from "@nestjs/swagger";
class UserDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 30)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 30)
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsStrongPassword(
    {
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        "Password is not strong enough. It must contain at least 12 characters, including uppercase, lowercase, numbers, and symbols.",
    },
  )
  password!: string;
  @IsString()
  @IsOptional()
  avatarUrl?: string;
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

export class RegisterUserDto extends OmitType(UserDto, ["avatarUrl", "isVerified"] as const) {}
export class UpdateUserDto extends PartialType(OmitType(UserDto, ["email", "password"] as const)) {}
