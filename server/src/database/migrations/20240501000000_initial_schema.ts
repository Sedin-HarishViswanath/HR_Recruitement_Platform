import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. ROLES
  await knex.schema.createTable('roles', (table) => {
    table.bigIncrements('id').primary();
    table.string('name').notNullable().unique();
    table.timestamps(true, true);
  });

  // 2. COMPANIES
  await knex.schema.createTable('companies', (table) => {
    table.bigIncrements('id').primary();
    table.string('name').notNullable();
    table.string('domain').unique();
    table.string('company_size');
    table.string('industry');
    table.string('address_line1');
    table.string('address_line2');
    table.string('city');
    table.string('state');
    table.string('country');
    table.string('postal_code');
    table.string('contact_email');
    table.string('contact_phone');
    table.string('status').defaultTo('pending'); // pending, active, rejected
    table.boolean('active').notNullable().defaultTo(true);
    table.bigInteger('admin_user_id').nullable(); // FK added later
    table.timestamps(true, true);

    table.index(['active', 'status', 'domain']);
  });

  // 3. USERS
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_digest').notNullable();
    table.string('name');
    table.bigInteger('company_id').unsigned().references('id').inTable('companies').onDelete('SET NULL');
    table.timestamps(true, true);

    table.index(['email', 'company_id']);
  });

  // Add FK for companies.admin_user_id -> users.id
  await knex.schema.alterTable('companies', (table) => {
    table.foreign('admin_user_id').references('id').inTable('users').onDelete('SET NULL');
  });

  // 4. MEMBERSHIPS
  await knex.schema.createTable('memberships', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.bigInteger('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.timestamps(true, true);

    table.unique(['user_id', 'role_id']);
  });

  // 5. JOBS
  await knex.schema.createTable('jobs', (table) => {
    table.bigIncrements('id').primary();
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.string('status').defaultTo('draft'); // draft, published, closed
    table.string('department');
    table.string('location');
    table.string('experience_level'); // entry, mid, senior
    table.specificType('required_skills', 'text[]');
    table.bigInteger('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE');
    table.bigInteger('created_by_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);

    table.index(['company_id', 'created_by_id', 'status']);
  });

  // 6. CANDIDATES
  await knex.schema.createTable('candidates', (table) => {
    table.bigIncrements('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('phone');
    table.string('password_digest');
    table.string('location');
    table.string('resume_url');
    table.string('linkedin_url');
    table.string('github_url');
    table.string('portfolio_url');
    table.string('status').defaultTo('new');
    table.text('resume_text');
    table.specificType('skills', 'text[]');
    table.decimal('ai_match_score', 5, 2);
    table.text('summary');
    table.jsonb('resume_data').defaultTo('{}');
    table.jsonb('experience').defaultTo('[]');
    table.jsonb('preferences').defaultTo('{}');
    table.integer('current_step').defaultTo(1);
    table.boolean('onboarding_completed').defaultTo(false);
    table.integer('profile_completion').defaultTo(0);
    table.decimal('profile_strength_score', 5, 2).defaultTo(0.0);
    table.bigInteger('company_id').unsigned().references('id').inTable('companies').onDelete('CASCADE');
    table.timestamps(true, true);

    table.index(['company_id', 'email']);
    table.index(['onboarding_completed']);
  });

  // 7. APPLICATIONS
  await knex.schema.createTable('applications', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('job_id').unsigned().notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    table.bigInteger('candidate_id').unsigned().notNullable().references('id').inTable('candidates').onDelete('CASCADE');
    table.bigInteger('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.string('status').defaultTo('applied');
    table.timestamp('applied_at').notNullable().defaultTo(knex.fn.now());
    table.string('resume_url');
    table.text('cover_note');
    table.decimal('ai_score', 5, 2);
    table.specificType('parsed_skills', 'text[]');
    table.timestamps(true, true);

    table.unique(['job_id', 'candidate_id']);
  });

  // 8. INTERVIEWS
  await knex.schema.createTable('interviews', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.string('round_type').notNullable(); // phone, screening, technical, behavioral, hr, final
    table.bigInteger('interviewer_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('scheduled_at').notNullable();
    table.string('status').defaultTo('scheduled'); // scheduled, completed, cancelled
    table.string('meeting_link');
    table.timestamps(true, true);
  });

  // 9. FEEDBACKS
  await knex.schema.createTable('feedbacks', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('interview_id').unsigned().notNullable().references('id').inTable('interviews').onDelete('CASCADE');
    table.integer('rating').notNullable(); // 1-5
    table.text('strengths');
    table.text('weaknesses');
    table.string('recommendation').notNullable(); // strong_hire, hire, no_hire, strong_no_hire
    table.timestamps(true, true);
  });

  // 10. ACTIVE STORAGE BLOBS
  await knex.schema.createTable('active_storage_blobs', (table) => {
    table.bigIncrements('id').primary();
    table.string('key').notNullable().unique();
    table.string('filename').notNullable();
    table.string('content_type');
    table.text('metadata');
    table.string('service_name').notNullable();
    table.bigInteger('byte_size').notNullable();
    table.string('checksum').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 11. ACTIVE STORAGE ATTACHMENTS
  await knex.schema.createTable('active_storage_attachments', (table) => {
    table.bigIncrements('id').primary();
    table.string('name').notNullable();
    table.string('record_type').notNullable();
    table.bigInteger('record_id').notNullable();
    table.bigInteger('blob_id').unsigned().notNullable().references('id').inTable('active_storage_blobs').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['record_type', 'record_id', 'name', 'blob_id'], 'index_active_storage_attachments_uniqueness', { indexType: 'unique' });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('active_storage_attachments');
  await knex.schema.dropTableIfExists('active_storage_blobs');
  await knex.schema.dropTableIfExists('feedbacks');
  await knex.schema.dropTableIfExists('interviews');
  await knex.schema.dropTableIfExists('applications');
  await knex.schema.dropTableIfExists('candidates');
  await knex.schema.dropTableIfExists('jobs');
  await knex.schema.dropTableIfExists('memberships');
  
  // Need to remove FK before dropping companies/users
  await knex.schema.alterTable('companies', (table) => {
    table.dropForeign(['admin_user_id']);
  });
  
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('companies');
  await knex.schema.dropTableIfExists('roles');
}
