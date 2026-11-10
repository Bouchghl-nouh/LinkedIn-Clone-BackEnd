import { emailLayout } from "./email-layout.template.js";
export function emailVerification(verificationUrl: string): string {
  const content = `  <td style="padding: 16px 32px 32px 32px; font-size: 16px; line-height: 1.5;">
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
            </td>`;
  return emailLayout(content);
}
