import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Extend users table
  await knex.schema.alterTable('users', (table) => {
    table.boolean('is_verified').defaultTo(false);
  });

  // 2. Extend candidates table
  await knex.schema.alterTable('candidates', (table) => {
    table.boolean('is_verified').defaultTo(false);
  });

  // 3. Create verification_tokens table
  await knex.schema.createTable('verification_tokens', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
    table.bigInteger('candidate_id').unsigned().references('id').inTable('candidates').onDelete('CASCADE').nullable();
    table.string('token').notNullable().unique();
    table.enum('type', ['email_verify', 'password_reset']).notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['token']);
    table.index(['user_id']);
    table.index(['candidate_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('verification_tokens');

  await knex.schema.alterTable('candidates', (table) => {
    table.dropColumn('is_verified');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('is_verified');
  });
}
