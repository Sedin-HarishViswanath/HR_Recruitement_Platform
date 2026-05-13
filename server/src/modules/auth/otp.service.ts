import crypto from 'crypto';
import { db } from '../../config/db';
import { AppError } from '../../shared/errors/AppError';
import { sendEmail } from '../../shared/utils/email';

export class OtpService {
  private generateOtp(): string {
    // Generate a cryptographically secure 6-digit OTP
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendOtp(email: string, isCandidate: boolean): Promise<void> {
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing unused OTPs for this email
    await db('otp_codes').where({ email, used: false }).update({ used: true });

    // Insert new OTP
    await db('otp_codes').insert({
      email,
      otp_code: otp,
      is_candidate: isCandidate,
      expires_at: expiresAt,
    });

    // Send OTP email
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border-radius: 16px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <div style="text-align:center; margin-bottom: 32px;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 900; margin: 0;">Verify Your Email</h1>
          <p style="color: #64748b; margin: 8px 0 0;">Enter this code in the app to complete your signup</p>
        </div>
        <div style="background: #fff; border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px;">Your Verification Code</p>
          <p style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #0f172a; margin: 0; font-family: monospace;">${otp}</p>
          <p style="color: #94a3b8; font-size: 11px; margin: 12px 0 0;">Expires in 10 minutes</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you did not create an account, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Your RecruitAI Verification Code',
      html,
      eventType: 'otp_verification',
    });
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const record = await db('otp_codes')
      .where({ email, otp_code: otp, used: false })
      .where('expires_at', '>', db.fn.now())
      .first();

    if (!record) {
      throw new AppError('Invalid or expired verification code', 400);
    }

    // Mark OTP as used
    await db('otp_codes').where({ id: record.id }).update({ used: true });

    // Mark user/candidate as verified
    if (record.is_candidate) {
      await db('candidates').where({ email }).update({ is_verified: true });
    } else {
      await db('users').where({ email }).update({ is_verified: true });
    }

    return true;
  }

  async resendOtp(email: string): Promise<void> {
    // Determine if candidate or user
    const candidate = await db('candidates').where({ email }).first();
    const isCandidate = !!candidate;

    if (!candidate) {
      const user = await db('users').where({ email }).first();
      if (!user) {
        throw new AppError('Email not found. Please sign up first.', 404);
      }
    }

    await this.sendOtp(email, isCandidate);
  }
}

export const otpService = new OtpService();
