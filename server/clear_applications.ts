import Knex from 'knex';
import config from './knexfile';

async function clearApplications() {
  const env = process.env.NODE_ENV || 'development';
  const knex = Knex(config[env]);
  try {
    await knex('applications').del();
    console.log('Applications table cleared successfully.');
  } catch (err) {
    console.error('Error clearing applications table:', err);
  } finally {
    await knex.destroy();
  }
}

clearApplications();
