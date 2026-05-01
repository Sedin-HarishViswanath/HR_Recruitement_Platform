import crypto from 'crypto';
import { db } from '../../config/db';
import { sendEmail } from '../../shared/utils/mail';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';
import bcrypt from 'bcryptjs';

export class RecoveryService {
  async sendVerificationEmail(userId: string, isCandidate: boolean, email: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db('verification_tokens').insert({
      [isCandidate ? 'candidate_id' : 'user_id']: userId,
      token,
      type: 'email_verify',
      expires_at: expiresAt,
    });

    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
      <h1>Verify your email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${link}">${link}</a>
    `;

    await sendEmail(email, 'Verify your email - HR Platform', html);
  }

  async verifyEmail(token: string) {
    const tokenRecord = await db('verification_tokens')
      .where({ token, type: 'email_verify' })
      .whereNull('used_at')
      .where('expires_at', '>', db.fn.now())
      .first();

    if (!tokenRecord) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    const isCandidate = !!tokenRecord.candidate_id;
    const userId = isCandidate ? tokenRecord.candidate_id : tokenRecord.user_id;

    await db.transaction(async (trx) => {
      // Mark token as used
      await trx('verification_tokens')
        .where({ id: tokenRecord.id })
        .update({ used_at: trx.fn.now() });

      // Mark user as verified
      await trx(isCandidate ? 'candidates' : 'users')
        .where({ id: userId })
        .update({ is_verified: true });
    });

    return { success: true };
  }

  async sendPasswordResetEmail(email: string) {
    let userRecord = await db('users').where({ email }).first();
    let isCandidate = false;

    if (!userRecord) {
      userRecord = await db('candidates').where({ email }).first();
      if (userRecord) isCandidate = true;
    }

    if (!userRecord) {
      // Do not reveal that the email doesn't exist
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db('verification_tokens').insert({
      [isCandidate ? 'candidate_id' : 'user_id']: userRecord.id,
      token,
      type: 'password_reset',
      expires_at: expiresAt,
    });

    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}">${link}</a>
    `;

    await sendEmail(email, 'Password Reset - HR Platform', html);
    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenRecord = await db('verification_tokens')
      .where({ token, type: 'password_reset' })
      .whereNull('used_at')
      .where('expires_at', '>', db.fn.now())
      .first();

    if (!tokenRecord) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const isCandidate = !!tokenRecord.candidate_id;
    const userId = isCandidate ? tokenRecord.candidate_id : tokenRecord.user_id;
    const password_digest = await bcrypt.hash(newPassword, 12);

    await db.transaction(async (trx) => {
      // Update password
      await trx(isCandidate ? 'candidates' : 'users')
        .where({ id: userId })
        .update({ password_digest });

      // Mark token as used
      await trx('verification_tokens')
        .where({ id: tokenRecord.id })
        .update({ used_at: trx.fn.now() });

      // Invalidate all refresh tokens for this user
      await trx('refresh_tokens')
        .where({ [isCandidate ? 'candidate_id' : 'user_id']: userId })
        .update({ revoked_at: trx.fn.now() });
    });

    return { success: true };
  }
}

export const recoveryService = new RecoveryService();
