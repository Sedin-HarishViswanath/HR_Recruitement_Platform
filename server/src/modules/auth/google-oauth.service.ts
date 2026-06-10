import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { db } from '../../config/db';
import { generateAccessToken, generateRefreshToken } from '../../shared/utils/jwt';
import crypto from 'crypto';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export class GoogleOAuthService {
  async handleGoogleLogin(idToken: string, role: 'candidate' | 'company') {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new AppError('Invalid Google Token', 400);
      }

      const { email, name } = payload;
      let userRecord;
      let isCandidate = false;
      let isNewUser = false;

      // 1. Check if user exists
      let existingUser = await db('users')
        .leftJoin('memberships', 'users.id', 'memberships.user_id')
        .leftJoin('roles', 'memberships.role_id', 'roles.id')
        .select(
          'users.*',
          'roles.name as role_name',
          'companies.status as company_status',
          'companies.domain as company_domain',
          'companies.company_size as company_size'
        )
        .leftJoin('companies', 'users.company_id', 'companies.id')
        .where('users.email', email)
        .first();

      if (existingUser) {
        userRecord = existingUser;
        // Auto-assign Admin role if missing for existing company users
        if (!userRecord.role_name && userRecord.company_id) {
          console.log(`GoogleOAuthService: Auto-assigning Admin role to existing user ${userRecord.id}`);
          const adminRole = await db('roles').where({ name: 'Admin' }).first();
          if (adminRole) {
            await db('memberships').insert({
              user_id: userRecord.id,
              role_id: adminRole.id,
            }).catch(() => {});
            userRecord.role_name = 'Admin';
          }
        }
      } else {
        const existingCandidate = await db('candidates').where({ email }).first();
        if (existingCandidate) {
          isCandidate = true;
          userRecord = existingCandidate;
          userRecord.role_name = 'Candidate';
        }
      }

      // 2. If user doesn't exist, create them
      if (!userRecord) {
        isNewUser = true;
        if (role === 'candidate') {
          const [candidate] = await db('candidates')
            .insert({
              name: name || 'Google User',
              email,
              password_digest: crypto.randomBytes(32).toString('hex'), // Random password, they use Google
              is_verified: true, // Google emails are verified
              current_step: 1,
              onboarding_completed: false,
              profile_completion: 0,
            })
            .returning('*');
          
          userRecord = candidate;
          isCandidate = true;
          userRecord.role_name = 'Candidate';
        } else {
          // Company admin registration
          await db.transaction(async (trx) => {
            const adminRole = await trx('roles').where({ name: 'Admin' }).first();
            
            const [user] = await trx('users')
              .insert({
                name: name || 'Google User',
                email,
                password_digest: crypto.randomBytes(32).toString('hex'),
                is_verified: true,
              })
              .returning('*');

            await trx('memberships').insert({
              user_id: user.id,
              role_id: adminRole.id,
            });

            const [company] = await trx('companies')
              .insert({
                name: `${name}'s Company`,
                status: 'pending',
                admin_user_id: user.id,
              })
              .returning(['id']);

            await trx('users').where({ id: user.id }).update({ company_id: company.id });
            
            userRecord = { ...user, company_id: company.id };
            userRecord.role_name = 'Admin';
          });
        }
      }

      // 3. Generate Tokens (Same logic as login)
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

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await db('refresh_tokens').insert({
        [isCandidate ? 'candidate_id' : 'user_id']: userRecord.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      const companyStatus = userRecord.company_status || (isCandidate ? undefined : 'pending');
      const onboardingCompleted = isCandidate
        ? !!userRecord.onboarding_completed
        : (!!userRecord.company_domain && !!userRecord.company_size);

      return {
        accessToken,
        refreshToken,
        isNewUser,
        user: {
          id: userRecord.id.toString(),
          name: userRecord.name,
          email: userRecord.email,
          role: userRecord.role_name,
          companyId: userRecord.company_id?.toString(),
          companyStatus,
          onboardingCompleted,
        },
      };
    } catch (error) {
      console.error('Google Auth Error:', error);
      throw new AppError('Authentication with Google failed', 401);
    }
  }
}

export const googleOAuthService = new GoogleOAuthService();
