import { db } from '../src/config/db';

async function run() {
  try {
    await db('users').update({ failed_login_attempts: 0, lock_until: null });
    await db('candidates').update({ failed_login_attempts: 0, lock_until: null });
    console.log("Successfully reset login attempts and locks for all users and candidates.");
  } catch (err) {
    console.error("Error resetting locks:", err);
  } finally {
    process.exit(0);
  }
}

run();
