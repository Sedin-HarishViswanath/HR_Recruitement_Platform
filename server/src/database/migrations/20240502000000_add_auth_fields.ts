import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Extend users table
  await knex.schema.alterTable('users', (table) => {
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('lock_until').nullable();
  });

  // 2. Extend candidates table
  await knex.schema.alterTable('candidates', (table) => {
    // The prompt says candidates table needs password_digest, but we already added it in the initial schema.
    // We just need to add the lockout fields.
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('lock_until').nullable();
  });

  // 3. Create refresh_tokens table
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
    table.bigInteger('candidate_id').unsigned().references('id').inTable('candidates').onDelete('CASCADE').nullable();
    table.string('token_hash').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('revoked_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Ensure it belongs to either a user or a candidate, not both or neither (app-level logic handles this)
    table.index(['user_id']);
    table.index(['candidate_id']);
    table.index(['token_hash']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('refresh_tokens');

  await knex.schema.alterTable('candidates', (table) => {
    table.dropColumn('failed_login_attempts');
    table.dropColumn('lock_until');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('failed_login_attempts');
    table.dropColumn('lock_until');
  });
}
