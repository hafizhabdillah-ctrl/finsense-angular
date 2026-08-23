const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { sendResetEmail } = require('../services/emailService');

function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function generateRefreshToken(userId) {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await prisma.refreshToken.create({
    data: { token, user_id: userId, expiresAt },
  });
  return token;
}

exports.register = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res
        .status(400)
        .json({ error: 'Email, password, full_name required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ error: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password_hash: hashed, full_name },
    });
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email, full_name: user.full_name },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ error: 'Refresh token required' });

    const tokenDoc = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!tokenDoc || tokenDoc.revoked || tokenDoc.expiresAt < new Date()) {
      return res
        .status(403)
        .json({ error: 'Invalid or expired refresh token' });
    }

    // Buat access token baru
    const newAccessToken = generateAccessToken(tokenDoc.user_id);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        is_verified: true,
        created_at: true,
        umkm_profile: true,
      },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized: user ID missing' });
    }
    const { full_name, email } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { full_name, email },
      select: { id: true, email: true, full_name: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 1. Forgot Password – kirim email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Email tidak terdaftar' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { email },
      data: {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const userName = user.full_name || user.email.split('@')[0] || 'Pengguna';

    // Kirim email dengan nama user
    await sendResetEmail(email, resetLink, userName);

    res.json({ message: 'Link reset password telah dikirim ke email Anda' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengirim email. Coba lagi nanti.' });
  }
};

// 2. Reset Password – verifikasi token & update password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token, // <-- gunakan reset_token
        reset_token_expiry: { gt: new Date() },
      },
    });
    if (!user) {
      return res
        .status(400)
        .json({ error: 'Token tidak valid atau sudah kadaluarsa' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      },
    });

    res.json({ message: 'Password berhasil direset. Silakan login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mereset password' });
  }
};
