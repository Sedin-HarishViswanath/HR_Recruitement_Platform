import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  const email = 'superadmin1@gmail.com';
  const password = 'password123';
  const name = 'System Super Admin';

  let user = await knex('users').where({ email }).first();
  if (!user) {
    const password_digest = await bcrypt.hash(password, 12);
    [user] = await knex('users')
      .insert({
        email,
        password_digest,
        name,
      })
      .returning(['id']);
    console.log(`Super admin user created: ${email}`);
  }

  // Get Super Admin role ID
  const role = await knex('roles').where({ name: 'Super Admin' }).first();
  if (!role) {
    throw new Error('Super Admin role not found. Run roles seed first.');
  }

  // Ensure membership exists
  const existingMembership = await knex('memberships')
    .where({ user_id: user.id, role_id: role.id })
    .first();

  if (!existingMembership) {
    await knex('memberships').insert({
      user_id: user.id,
      role_id: role.id,
    });
    console.log(`Super admin membership assigned: ${email}`);
  } else {
    console.log('Super admin already has correct role');
  }
}
