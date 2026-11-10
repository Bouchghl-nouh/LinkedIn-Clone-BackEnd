export function emailLayout(content: string): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f2ef; padding: 40px 0; color: #191919;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 32px 32px 16px 32px;">
              <h1 style="margin: 0; color: #0a66c2; font-size: 24px; font-weight: 700;">LinkedIn Clone</h1>
            </td>
          </tr>
          <tr>
            ${content}
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; font-size: 12px; color: #8c8c8c; text-align: center;">
              <p style="margin: 0;">© ${new Date().getFullYear()} LinkedIn Clone. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </div>`;
}
