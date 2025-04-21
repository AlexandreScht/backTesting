/* eslint-disable prettier/prettier */
import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

/** Identifier type for public.users */
export type UsersId = number & { __brand: 'public.users' };

/** Represents the table public.users */
export default interface UsersTable {
  id: ColumnType<UsersId, UsersId | undefined, UsersId>;

  first_name: ColumnType<string, string, string>;

  last_name: ColumnType<string, string, string>;

  created_at: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type Users = Selectable<UsersTable>;

export type NewUsers = Insertable<UsersTable>;
export type UsersUpdate = Updateable<UsersTable>;
