import type DatabaseShape from '@/types/models/Database';
import type { Insertable, Selectable, Updateable } from 'kysely';

export namespace Database {
  export type RestrictedKeys = 'created_at' | 'updated_at';
  type FilteredTable<T> = {
    Selectable: Selectable<T>;
    Insertable: Omit<Insertable<T>, RestrictedKeys>;
    Updateable: Omit<Updateable<T>, RestrictedKeys>;
  };
  export type DB = {
    [TableName in keyof DatabaseShape]: FilteredTable<DatabaseShape[TableName]>;
  };
}
