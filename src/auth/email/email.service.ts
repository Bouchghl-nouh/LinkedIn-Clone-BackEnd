import { Injectable } from '@nestjs/common';
import { MailtrapClient } from 'mailtrap';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class EmailService {
  private readonly mailerService: MailtrapClient;
  constructor(private readonly configService: ConfigService) {
    this.mailerService = new MailtrapClient({
      token: configService.get<string>('MAILTRAP_API_TOKEN') ?? 'Token',
      sandbox: true,
      testInboxId: parseInt(
        configService.get<string>('MAILTRAP_INBOX_ID') ?? '0',
      ),
    });
  }
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    await this.mailerService.send({
      from: {
        email:
          this.configService.get<string>('MAILTRAP_USER_EMAIL') ??
          'hello@rpaintel.com',
        name: 'LinkedIn Clone',
      },
      to: [
        {
          email: email,
        },
      ],
      subject: 'Email Verification',
      html: `<p>Click the link below to verify your email:</p>
             <a href="http://localhost:3000/auth/verify-email?token=${token}">Verify Email</a>`,
    });
  }
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    await this.mailerService.send({
      from: {
        email:
          this.configService.get<string>('MAILTRAP_USER_EMAIL') ??
          'hello@rpaintel.com',
        name: 'LinkedIn Clone',
      },
      to: [
        {
          email: email,
        },
      ],
      subject: 'Password Reset',
      text: `Reset your password: http://localhost:3000/auth/reset-password?token=${token}`,
    });
  }
}
