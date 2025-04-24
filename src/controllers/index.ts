import dbInstance from '@/database/pg';
import type Database from '@/types/models/Database';
import { type Transaction } from 'kysely';

export default class ControllerClass {
  private db: typeof dbInstance.getDb;
  constructor() {
    this.db = dbInstance.getDb;
  }

  protected async transactionBuilder<T, V>(
    serviceFn: (trx: Transaction<Database>) => Promise<T>,
    logicFn: (result: T, trx: Transaction<Database>) => Promise<V>,
  ): Promise<V> {
    return await this.db.transaction().execute(async trx => {
      const result = await serviceFn(trx);
      return logicFn(result, trx);
    });
  }
}
