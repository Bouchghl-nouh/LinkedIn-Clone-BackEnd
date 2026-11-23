import { Injectable } from "@nestjs/common";
import { MailtrapClient } from "mailtrap";
import { ConfigService } from "@nestjs/config";
import { emailVerification } from "./templates/email-verification.template.js";
import { resetPasswordEmailTemplate } from "./templates/reset-password.template.js";
@Injectable()
export class EmailService {
  private readonly mailerService: MailtrapClient;
  constructor(private readonly configService: ConfigService) {
    this.mailerService = new MailtrapClient({
      token: configService.get<string>("MAILTRAP_API_TOKEN") ?? "Token",
      sandbox: true,
      testInboxId: parseInt(configService.get<string>("MAILTRAP_INBOX_ID") ?? "0"),
    });
  }
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const baseUrl = this.configService.get<string>("APP_URL");
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
    await this.mailerService.send({
      from: {
        email: this.configService.get<string>("MAILTRAP_USER_EMAIL") ?? "hello@rpaintel.com",
        name: "LinkedIn Clone",
      },
      to: [
        {
          email: email,
        },
      ],
      subject: "Email Verification",
      html: emailVerification(verificationUrl),
    });
  }
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const baseUrl = this.configService.get<string>("APP_URL");
    // this link should be changed later to the frontend link for resetting password
    const verificationUrl = `${baseUrl}/auth/reset-password?token=${token}`;
    await this.mailerService.send({
      from: {
        email: this.configService.get<string>("MAILTRAP_USER_EMAIL") ?? "hello@rpaintel.com",
        name: "LinkedIn Clone",
      },
      to: [
        {
          email: email,
        },
      ],
      subject: "Password Reset",
      html: resetPasswordEmailTemplate(verificationUrl),
    });
  }
}
