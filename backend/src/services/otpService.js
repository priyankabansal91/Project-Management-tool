const crypto = require('crypto');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendOtpEmail } = require('./emailService');

const OTP_TTL_MINUTES = 10;
const MAX_ACTIVE_OTPS = 5; // prevent spam

function generateCode() {
  return String(crypto.randomInt(100000, 999999));
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function sendOtp(email, purpose) {
  // Rate-limit: invalidate any previous OTPs for this email+purpose
  await prisma.emailOtp.updateMany({
    where: { email, purpose, usedAt: null },
    data: { usedAt: new Date() }, // mark old ones used so they can't be replayed
  });

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.emailOtp.create({ data: { email, codeHash, purpose, expiresAt } });

  await sendOtpEmail({ to: email, code, purpose, expiresMinutes: OTP_TTL_MINUTES });

  return { sent: true, expiresAt };
}

async function verifyOtp(email, code, purpose) {
  const codeHash = hashCode(code);
  const now = new Date();

  const otp = await prisma.emailOtp.findFirst({
    where: {
      email,
      purpose,
      codeHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) throw ApiError.badRequest('Invalid or expired OTP. Please request a new one.');

  // Mark as used
  await prisma.emailOtp.update({ where: { id: otp.id }, data: { usedAt: now } });

  // If purpose is verify_email, mark the user's email as verified
  if (purpose === 'verify_email') {
    await prisma.user.updateMany({
      where: { email, emailVerifiedAt: null },
      data: { emailVerifiedAt: now, status: 'active' },
    });
  }

  return { verified: true, email, purpose };
}

module.exports = { sendOtp, verifyOtp };
