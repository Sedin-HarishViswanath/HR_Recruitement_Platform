import bcrypt from 'bcryptjs';
import { db } from '../../config/db';
import { logger } from '../../shared/utils/logger';
import { notificationService } from '../notification/notification.service';
import { SignupInput, LoginInput } from './auth.schema';
import { AppError } from '../../shared/errors/AppError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export class AuthService {
  async signup(data: SignupInput) {

    const { name, email, password, role, companyDetails, candidateDetails } = data;

    // Check for duplicate email in both tables
    const existingUser = await db('users').where({ email }).first();
    const existingCandidate = await db('candidates').where({ email }).first();

    if (existingUser || existingCandidate) {
      throw new AppError('Email already in use', 400);
    }

    const password_digest = await bcrypt.hash(password, SALT_ROUNDS);

    return await db.transaction(async (trx) => {
      if (role === 'candidate') {
        const [candidate] = await trx('candidates')
          .insert({
            name,
            email,
            password_digest,
            phone: candidateDetails?.phone,
            location: candidateDetails?.location,
            skills: candidateDetails?.skills ? candidateDetails.skills.split(',').map(s => s.trim()) : [],
            current_step: 1,
            onboarding_completed: false,
            profile_completion: 0,
          })
          .returning(['id', 'name', 'email']);

        const result = { user: candidate, role: 'Candidate' };
        void notificationService.notifyWelcome(candidate.id, candidate.name, candidate.email, true);
        return result;
      } else {
        // Company role
        const adminRole = await trx('roles').where({ name: 'Admin' }).first();
        if (!adminRole) {
          throw new AppError('Admin role not found. Seed the database.', 500);
        }

        const [user] = await trx('users')
          .insert({
            name,
            email,
            password_digest,
          })
          .returning(['id', 'name', 'email']);

        await trx('memberships').insert({
          user_id: user.id,
          role_id: adminRole.id,
        });

        const [company] = await trx('companies')
          .insert({
            name: companyDetails?.companyName || `${name}'s Company`,
            domain: companyDetails?.domain,
            company_size: companyDetails?.size,
            industry: companyDetails?.industry,
            address_line1: companyDetails?.address1,
            address_line2: companyDetails?.address2,
            city: companyDetails?.city,
            state: companyDetails?.state,
            country: companyDetails?.country,
            postal_code: companyDetails?.zip,
            contact_email: companyDetails?.contactEmail,
            contact_phone: companyDetails?.contactPhone,
            status: 'pending',
            admin_user_id: user.id,
          })
          .returning(['id']);

        await trx('users').where({ id: user.id }).update({ company_id: company.id });

        const result = { 
          user: { 
            ...user, 
            companyId: company.id.toString(),
            companyStatus: 'pending'
          },
          role: 'Admin'
        };
        void notificationService.notifyWelcome(user.id, user.name, user.email, false);
        return result;
      }
    });
  }

  async login(data: LoginInput) {
    const { email, password } = data;

    // Try finding in users first
    let userRecord = await db('users')
      .leftJoin('memberships', 'users.id', 'memberships.user_id')
      .leftJoin('roles', 'memberships.role_id', 'roles.id')
      .leftJoin('companies', 'users.company_id', 'companies.id')
      .select(
        'users.*',
        'roles.name as role_name',
        'companies.status as company_status',
        'companies.domain as company_domain',
        'companies.company_size as company_size'
      )
      .where('users.email', email)
      .first();

    let isCandidate = false;

    // If not found, try candidates
    if (!userRecord) {
      userRecord = await db('candidates').where({ email }).first();
      if (userRecord) {
        isCandidate = true;
        userRecord.role_name = 'Candidate'; // Virtual role
      }
    }

    if (!userRecord) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check lockout status
    if (userRecord.failed_login_attempts >= MAX_LOGIN_ATTEMPTS && userRecord.lock_until) {
      if (new Date() < new Date(userRecord.lock_until)) {
        throw new AppError('Account temporarily locked. Try again later.', 423);
      } else {
        // Lock expired, reset
        await this.resetLoginAttempts(userRecord.id, isCandidate);
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userRecord.password_digest);

    if (!isPasswordValid) {
      await this.incrementLoginAttempts(userRecord.id, isCandidate, userRecord.failed_login_attempts);
      throw new AppError('Invalid email or password', 401);
    }

    // Auto-assign Admin role if missing for company users
    if (!isCandidate && !userRecord.role_name && userRecord.company_id) {
      logger.info(`Auto-assigning Admin role to user ${userRecord.id}`, { module: 'Auth' });
      const adminRole = await db('roles').where({ name: 'Admin' }).first();
      if (adminRole) {
        await db('memberships').insert({
          user_id: userRecord.id,
          role_id: adminRole.id,
        }).catch(() => {}); // Ignore if already exists (race condition)
        userRecord.role_name = 'Admin';
      }
    }

    // For company users, check company status
    if (!isCandidate && userRecord.company_status === 'pending') {
      // Allow them to login to complete onboarding, but maybe restrict access
      // For now, we allow them to login. Middleware will restrict them if needed.
    }

    // Reset login attempts on success
    await this.resetLoginAttempts(userRecord.id, isCandidate);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: userRecord.id.toString(),
      candidateId: isCandidate ? userRecord.id.toString() : undefined,
      role: userRecord.role_name,
      companyId: userRecord.company_id?.toString(),
      email: userRecord.email,
    });

    const refreshToken = generateRefreshToken({
      userId: userRecord.id.toString(),
    });

    // Store refresh token hash
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db('refresh_tokens').insert({
      [isCandidate ? 'candidate_id' : 'user_id']: userRecord.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userRecord.id.toString(),
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role_name,
        companyId: userRecord.company_id?.toString(),
        companyStatus: userRecord.company_status,
        onboardingCompleted: isCandidate ? !!userRecord.onboarding_completed : (!!userRecord.company_domain && !!userRecord.company_size),
      },
    };
  }

  private async incrementLoginAttempts(id: string, isCandidate: boolean, currentAttempts: number) {
    const table = isCandidate ? 'candidates' : 'users';
    const newAttempts = currentAttempts + 1;
    
    let lockUntil = null;
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }

    await db(table).where({ id }).update({
      failed_login_attempts: newAttempts,
      lock_until: lockUntil,
    });
  }

  private async resetLoginAttempts(id: string, isCandidate: boolean) {
    const table = isCandidate ? 'candidates' : 'users';
    await db(table).where({ id }).update({
      failed_login_attempts: 0,
      lock_until: null,
    });
  }

  async getCurrentUser(userId: string, role: string) {
    const isCandidate = role.toLowerCase() === 'candidate';
    let userRecord;
    if (isCandidate) {
      userRecord = await db('candidates').where({ id: userId }).first();
      if (userRecord) {
        userRecord.role_name = 'Candidate';
      }
    } else {
      userRecord = await db('users')
        .leftJoin('memberships', 'users.id', 'memberships.user_id')
        .leftJoin('roles', 'memberships.role_id', 'roles.id')
        .leftJoin('companies', 'users.company_id', 'companies.id')
        .select(
          'users.*',
          'roles.name as role_name',
          'companies.status as company_status',
          'companies.domain as company_domain',
          'companies.company_size as company_size'
        )
        .where('users.id', userId)
        .first();
    }

    if (!userRecord) {
      throw new AppError('User not found', 404);
    }

    return {
      id: userRecord.id.toString(),
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role_name || role,
      companyId: userRecord.company_id?.toString(),
      companyStatus: userRecord.company_status,
      onboardingCompleted: isCandidate ? !!userRecord.onboarding_completed : (!!userRecord.company_domain && !!userRecord.company_size),
    };
  }

  async refresh(token: string) {
    // 1. Verify token signature and expiry (throws if invalid/expired)
    verifyRefreshToken(token);

    // 2. Hash token to check in DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // 3. Find token in DB
    const tokenRecord = await db('refresh_tokens')
      .where({ token_hash: tokenHash })
      .first();

    if (!tokenRecord) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (tokenRecord.revoked_at) {
      throw new AppError('Refresh token revoked. Please login again.', 401);
    }

    // 4. Fetch user details to generate new access token
    const isCandidate = !!tokenRecord.candidate_id;
    const userId = isCandidate ? tokenRecord.candidate_id : tokenRecord.user_id;
    
    let userRecord;
    if (isCandidate) {
      userRecord = await db('candidates').where({ id: userId }).first();
      userRecord.role_name = 'Candidate';
    } else {
      userRecord = await db('users')
        .leftJoin('memberships', 'users.id', 'memberships.user_id')
        .leftJoin('roles', 'memberships.role_id', 'roles.id')
        .select('users.*', 'roles.name as role_name')
        .where('users.id', userId)
        .first();
    }

    if (!userRecord) {
      throw new AppError('User not found', 404);
    }

    // 5. Generate new access token
    const accessToken = generateAccessToken({
      userId: userRecord.id.toString(),
      candidateId: isCandidate ? userRecord.id.toString() : undefined,
      role: userRecord.role_name,
      companyId: userRecord.company_id?.toString(),
      email: userRecord.email,
    });

    // Optional: Rotate refresh token here. Keeping it simple as per prompt.
    
    return { accessToken };
  }

  async logout(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await db('refresh_tokens')
      .where({ token_hash: tokenHash })
      .update({ revoked_at: db.fn.now() });
  }
}

export const authService = new AuthService();
