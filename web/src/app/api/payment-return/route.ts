import { NextResponse } from 'next/server';

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Returning to GearUp...</title>
        <script>
          window.location.href = "gearup://booking/confirmed";
        </script>
      </head>
      <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center;">
        <div>
          <h2>Returning to GearUp App...</h2>
          <p>If you are not redirected automatically, tap the button below.</p>
          <a href="gearup://booking/confirmed" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #15803d; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Return to App</a>
        </div>
      </body>
    </html>
  `;
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}