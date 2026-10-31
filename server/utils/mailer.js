const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a 6-digit OTP to the given email address.
 */
async function sendOtpEmail(toEmail, otp) {
  const fromName  = process.env.SMTP_FROM_NAME  || 'Photo Gallery';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: '📸 Your Photo Gallery Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background:#0F1F17; margin:0; padding:0; }
            .wrap { max-width:480px; margin:40px auto; background:#1E3A2E; border-radius:16px; overflow:hidden; border: 1px solid rgba(199,203,184,0.2); }
            .header { background: linear-gradient(135deg,#1E3A2E,#3E5A3F); padding:36px 24px; text-align:center; }
            .header h1 { color:#F1F3EB; margin:0; font-size:28px; letter-spacing:-0.5px; }
            .header p  { color:#C7CBB8; margin:6px 0 0; font-size:14px; }
            .body { padding:36px 32px; background:#0F1F17; }
            .body p { color:#C7CBB8; font-size:15px; line-height:1.7; margin:0 0 20px; }
            .otp-box {
              background: linear-gradient(135deg,rgba(62,90,63,0.3),rgba(30,58,46,0.5));
              border:2px solid #6B7F67;
              border-radius:12px;
              padding:24px;
              text-align:center;
              margin:24px 0;
            }
            .otp-box .label { color:#C7CBB8; font-size:12px; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
            .otp-code { color:#FFFFFF; font-size:42px; font-weight:800; letter-spacing:12px; }
            .expire { color:#C7CBB8; font-size:13px; margin-top:10px; }
            .footer { text-align:center; padding:20px 24px 28px; color:#6B7F67; font-size:12px; background:#0F1F17; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="header">
              <h1>📸 Photo Gallery</h1>
              <p>Email Verification</p>
            </div>
            <div class="body">
              <p>Hi there! Use the code below to verify your email address and activate your account.</p>
              <div class="otp-box">
                <div class="label">Your verification code</div>
                <div class="otp-code">${otp}</div>
                <div class="expire">Expires in <strong>10 minutes</strong></div>
              </div>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Photo Gallery · All rights reserved</div>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send a 6-digit password reset OTP to the given email address.
 */
async function sendResetOtpEmail(toEmail, otp) {
  const fromName  = process.env.SMTP_FROM_NAME  || 'Photo Gallery';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: '🔐 Your Photo Gallery Password Reset Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background:#0F1F17; margin:0; padding:0; }
            .wrap { max-width:480px; margin:40px auto; background:#1E3A2E; border-radius:16px; overflow:hidden; border: 1px solid rgba(199,203,184,0.2); }
            .header { background: linear-gradient(135deg,#3E5A3F,#1E3A2E); padding:36px 24px; text-align:center; }
            .header h1 { color:#F1F3EB; margin:0; font-size:28px; letter-spacing:-0.5px; }
            .header p  { color:#C7CBB8; margin:6px 0 0; font-size:14px; }
            .body { padding:36px 32px; background:#0F1F17; }
            .body p { color:#C7CBB8; font-size:15px; line-height:1.7; margin:0 0 20px; }
            .otp-box {
              background: linear-gradient(135deg,rgba(62,90,63,0.3),rgba(30,58,46,0.5));
              border:2px solid #6B7F67;
              border-radius:12px;
              padding:24px;
              text-align:center;
              margin:24px 0;
            }
            .otp-box .label { color:#C7CBB8; font-size:12px; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
            .otp-code { color:#FFFFFF; font-size:42px; font-weight:800; letter-spacing:12px; }
            .expire { color:#C7CBB8; font-size:13px; margin-top:10px; }
            .footer { text-align:center; padding:20px 24px 28px; color:#6B7F67; font-size:12px; background:#0F1F17; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="header">
              <h1>🔐 Photo Gallery</h1>
              <p>Password Reset</p>
            </div>
            <div class="body">
              <p>Hi there! We received a request to reset your password. Use the verification code below to set a new password:</p>
              <div class="otp-box">
                <div class="label">Password Reset Code</div>
                <div class="otp-code">${otp}</div>
                <div class="expire">Expires in <strong>10 minutes</strong></div>
              </div>
              <p>If you did not request a password reset, please ignore this email or make sure your account is secure.</p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Photo Gallery · All rights reserved</div>
          </div>
        </body>
      </html>
    `,
  });
}

module.exports = { sendOtpEmail, sendResetOtpEmail };
