import type DatabaseShape from '@/types/models/Database';
import { type Model } from 'kysely-orm';
interface QueryOperator<T> {
  are?: T | T[];
  not?: T | T[];
}

export type QueryCriteria<T> = {
  [K in keyof T]?: T[K] | QueryOperator<T[K]>;
};

type notUpdatableRows = 'id' | 'email';

export type updatableRows<T extends object> = Partial<Omit<T, notUpdatableRows>>;

export type modelClass = Model<DatabaseShape, keyof DatabaseShape & string, keyof DatabaseShape[keyof DatabaseShape & string] & string>;
