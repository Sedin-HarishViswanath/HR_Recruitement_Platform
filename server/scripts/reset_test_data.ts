import { db } from '../src/config/db';

const SUPERADMIN_EMAIL = 'superadmin1@gmail.com';

async function run() {
  console.log('Starting test data reset — keeping superadmin only...\n');

  try {
    // Resolve superadmin user id before any deletions
    const superAdmin = await db('users').where({ email: SUPERADMIN_EMAIL }).select('id').first();
    if (!superAdmin) {
      throw new Error(`Superadmin not found: ${SUPERADMIN_EMAIL}. Run seeds first.`);
    }
    const superAdminId = superAdmin.id;
    console.log(`Superadmin id: ${superAdminId} — will be preserved.`);

    // Delete in dependency order (children first)
    const steps: [string, string][] = [
      ['reschedule_requests', 'Reschedule requests'],
      ['interview_transcripts', 'Interview transcripts'],
      ['notification_logs', 'Notification logs'],
      ['notifications', 'Notifications'],
      ['feedbacks', 'Feedbacks'],
      ['offers', 'Offers'],
      ['interviews', 'Interviews'],
      ['applications', 'Applications'],
      ['jobs', 'Jobs'],
      ['stage_transitions', 'Stage transitions'],
    ];

    for (const [table, label] of steps) {
      try {
        const count = await db(table).del();
        console.log(`  Deleted ${count} rows from ${label}`);
      } catch {
        console.log(`  Skipped ${label} (table may not exist)`);
      }
    }

    // Delete candidates
    const candidateCount = await db('candidates').del();
    console.log(`  Deleted ${candidateCount} candidates`);

    // Delete company memberships (non-superadmin)
    const membershipCount = await db('memberships')
      .whereNot({ user_id: superAdminId })
      .del();
    console.log(`  Deleted ${membershipCount} memberships (superadmin preserved)`);

    // Delete non-superadmin users
    const userCount = await db('users')
      .whereNot({ id: superAdminId })
      .del();
    console.log(`  Deleted ${userCount} users (superadmin preserved)`);

    // Delete all companies
    const companyCount = await db('companies').del();
    console.log(`  Deleted ${companyCount} companies`);

    console.log('\nReset complete. Login with:');
    console.log(`  Email   : ${SUPERADMIN_EMAIL}`);
    console.log('  Password: password123');
  } catch (err) {
    console.error('\nReset failed:', err);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();
