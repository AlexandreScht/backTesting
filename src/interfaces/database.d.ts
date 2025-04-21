import DatabaseShape from '@/src/types/Database';

export namespace Database {
  export type tableList = Omit<DatabaseShape, 'kysely_migration' | 'kysely_migration_lock'>;
}
