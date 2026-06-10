import { db } from '../src/config/db';

async function run() {
  const users = await db('users').select('*');
  const candidates = await db('candidates').select('*');
  const companies = await db('companies').select('*');
  console.log('USERS:', users);
  console.log('CANDIDATES:', candidates);
  console.log('COMPANIES:', companies);
  process.exit(0);
}
run();
