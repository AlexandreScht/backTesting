import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('user_role').asEnum(['admin', 'premium', 'member']).execute();

  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('email', 'varchar(50)', col => col.notNull())
    .addColumn('password', 'varchar')
    .addColumn('firstName', 'varchar', col => col.notNull())
    .addColumn('lastName', 'varchar', col => col.notNull())
    .addColumn('role', sql`user_role`, col => col.notNull().defaultTo('member'))
    .addColumn('phone', 'char')
    .addColumn('validate', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('accessToken', 'uuid')
    .addColumn('stripeCustomerId', 'varchar')
    .addColumn('isSubscribed', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .addColumn('created_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createIndex('user_email_password_unique_idx')
    .on('users')
    .column('email')
    .unique()
    .where(sql`password IS NOT NULL` as any)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('user_email_password_unique_idx').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
  await db.schema.dropType('user_role').ifExists().execute();
}
