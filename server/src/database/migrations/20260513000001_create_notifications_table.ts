import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // In-app notifications table (persistent, per-user)
  await knex.schema.createTable('notifications', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
    table.bigInteger('candidate_id').unsigned().references('id').inTable('candidates').onDelete('CASCADE').nullable();
    table.string('title').notNullable();
    table.text('body').notNullable();
    table.string('type').defaultTo('info'); // info, success, warning, error
    table.string('link').nullable(); // optional deep-link
    table.timestamp('read_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['user_id', 'read_at']);
    table.index(['candidate_id', 'read_at']);
  });

  // OTP codes table for email verification
  await knex.schema.createTable('otp_codes', (table) => {
    table.bigIncrements('id').primary();
    table.string('email').notNullable();
    table.string('otp_code', 6).notNullable();
    table.boolean('is_candidate').defaultTo(false);
    table.boolean('used').defaultTo(false);
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['email', 'otp_code', 'used']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('otp_codes');
  await knex.schema.dropTableIfExists('notifications');
}
