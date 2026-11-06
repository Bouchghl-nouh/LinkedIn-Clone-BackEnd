import { Injectable } from "@nestjs/common";
import { MailtrapClient } from "mailtrap";
import { ConfigService } from "@nestjs/config";
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
    const baseUrl = this.configService.get<string>("APP_URL") ?? "http://localhost:3000";
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
      html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f2ef; padding: 40px 0; color: #191919;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 32px 32px 16px 32px;">
              <h1 style="margin: 0; color: #0a66c2; font-size: 24px; font-weight: 700;">LinkedIn Clone</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 32px 32px; font-size: 16px; line-height: 1.5;">
              <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 600; color: #000000;">Confirm your email address</h2>
              <p style="margin-top: 0; margin-bottom: 24px; color: #5e5e5e;">
                Thanks for joining! Please tap the button below to verify your email address and finish setting up your account.
              </p>

              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 24px; background-color: #0a66c2;">
                    <a href="${verificationUrl}" target="_blank" style="font-size: 16px; font-family: inherit; color: #ffffff; text-decoration: none; border-radius: 24px; padding: 12px 28px; border: 1px solid #0a66c2; display: inline-block; font-weight: 600;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin-bottom: 0; font-size: 14px; color: #717171;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; font-size: 12px; color: #8c8c8c; text-align: center;">
              <p style="margin: 0;">© 2026 LinkedIn Clone. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </div>`,
    });
  }
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
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
      text: `Reset your password: http://localhost:3000/auth/reset-password?token=${token}`,
    });
  }
}
