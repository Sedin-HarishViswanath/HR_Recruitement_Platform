import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('interviews', (table) => {
    table.string('daily_room_url').nullable();
    table.string('daily_room_name').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('interviews', (table) => {
    table.dropColumn('daily_room_url');
    table.dropColumn('daily_room_name');
  });
}
