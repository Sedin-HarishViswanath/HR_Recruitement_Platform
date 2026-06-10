import { db } from '../src/config/db';
import { googleOAuthService } from '../src/modules/auth/google-oauth.service';

async function test() {
  const users = await db('users').select('*').where({ email: 'harishviswanath017@gmail.com' });
  const companies = await db('companies').select('*');
  const memberships = await db('memberships').select('*');
  const roles = await db('roles').select('*');
  
  const user = users[0];
  const company = companies.find(c => c.id === user.company_id);
  const membership = memberships.find(m => m.user_id === user.id);
  const role = roles.find(r => r.id === membership?.role_id);
  
  const userRecord = {
    ...user,
    company_status: company?.status,
    company_domain: company?.domain,
    company_size: company?.company_size,
    role_name: role?.name,
  };
  
  const companyStatus = userRecord.company_status || 'pending';
  const onboardingCompleted = !!userRecord.company_domain && !!userRecord.company_size;
  
  console.log('userRecord:', userRecord);
  console.log('onboardingCompleted:', onboardingCompleted);
  process.exit(0);
}
test();
