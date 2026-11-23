import { IsStrongPassword } from "class-validator";

export class ResetPasswordDto {
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
  newPassword!: string;
}
