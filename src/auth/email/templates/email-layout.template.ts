export function emailLayout(content: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body marginwidth="0" marginheight="0" style="margin: 0; padding: 0; width: 100%; background-color: #f3f2ef;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" height="100%" bgcolor="#f3f2ef" style="width: 100%; height: 100vh; min-height: 100vh; margin: 0; background-color: #f3f2ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #191919;">
      <tr>
        <td align="center" valign="top" style="width: 100%; padding: 40px 16px;">
          <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
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
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
