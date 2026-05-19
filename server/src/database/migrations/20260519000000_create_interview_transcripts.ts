import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('interview_transcripts', (table) => {
    table.bigIncrements('id').primary();
    table
      .bigInteger('interview_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('interviews')
      .onDelete('CASCADE');
    table.string('speaker').notNullable(); // 'interviewer' | 'candidate'
    table.text('text').notNullable();
    table.string('timestamp').notNullable(); // display timestamp e.g. "10:30 AM"
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['interview_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('interview_transcripts');
}
