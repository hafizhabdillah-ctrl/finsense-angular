const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    const port = parseInt(process.env.MAIL_PORT || '587', 10);

    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: isNaN(port) ? 587 : port,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

async function sendResetEmail(to, resetLink, userName = 'Pengguna') {
  const mailOptions = {
    from: `"FinSense" <${process.env.EMAIL_FROM || process.env.MAIL_USER}>`,
    to,
    subject: '🔐 Reset Password FinSense - Permintaan Anda Diproses',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 24px 20px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 28px; letter-spacing: 1px;">Fin<span style="color: #F97316;">Sense</span></h1>
        </div>
        <div style="padding: 30px 24px; background: white;">
          <h2 style="color: #0F172A; margin-top: 0;">Halo, ${userName}!</h2>
          <p style="color: #334155; line-height: 1.6;">Kami menerima permintaan untuk mereset password akun FinSense Anda. Klik tombol di bawah untuk membuat password baru:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="display: inline-block; background-color: #0F172A; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; font-size: 16px;">Reset Password Sekarang</a>
          </div>
          <p style="color: #475569; font-size: 14px;">🔒 Link ini hanya berlaku selama <strong>1 jam</strong> sejak email dikirim.</p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="color: #64748B; font-size: 13px;">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>
        </div>
        <div style="background: #F8FAFC; padding: 16px; text-align: center; color: #94A3B8; font-size: 12px;">
          FinSense &copy; ${new Date().getFullYear()}
        </div>
      </div>
    `,
  };

  const mailer = getTransporter();
  await mailer.sendMail(mailOptions);
}

module.exports = { sendResetEmail };