import { emailLayout } from "./email-layout.template.js";
export function resetPasswordEmailTemplate(verificationUrl: string): string {
  const content = `  <td style="padding: 16px 32px 32px 32px; font-size: 16px; line-height: 1.5;">
              <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 600; color: #000000;">Reset your password</h2>
              <p style="margin-top: 0; margin-bottom: 24px; color: #5e5e5e;">
                We received a request to reset your password. Tap the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 24px; background-color: #0a66c2;">
                    <a href="${verificationUrl}" target="_blank" style="font-size: 16px; font-family: inherit; color: #ffffff; text-decoration: none; border-radius: 24px; padding: 12px 28px; border: 1px solid #0a66c2; display: inline-block; font-weight: 600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin-bottom: 0; font-size: 14px; color: #717171;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>`;
  return emailLayout(content);
}
