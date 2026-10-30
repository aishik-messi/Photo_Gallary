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
            body { font-family: 'Segoe UI', Arial, sans-serif; background:#0f0f1a; margin:0; padding:0; }
            .wrap { max-width:480px; margin:40px auto; background:#1a1a2e; border-radius:16px; overflow:hidden; }
            .header { background: linear-gradient(135deg,#667eea,#764ba2); padding:36px 24px; text-align:center; }
            .header h1 { color:#fff; margin:0; font-size:28px; letter-spacing:-0.5px; }
            .header p  { color:rgba(255,255,255,.8); margin:6px 0 0; font-size:14px; }
            .body { padding:36px 32px; }
            .body p { color:#c8c8e8; font-size:15px; line-height:1.7; margin:0 0 20px; }
            .otp-box {
              background: linear-gradient(135deg,#667eea22,#764ba222);
              border:2px solid #667eea55;
              border-radius:12px;
              padding:24px;
              text-align:center;
              margin:24px 0;
            }
            .otp-box .label { color:#a0a0c8; font-size:12px; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
            .otp-code { color:#fff; font-size:42px; font-weight:800; letter-spacing:12px; }
            .expire { color:#a0a0c8; font-size:13px; margin-top:10px; }
            .footer { text-align:center; padding:20px 24px 28px; color:#666; font-size:12px; }
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

module.exports = { sendOtpEmail };
