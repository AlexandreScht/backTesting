import dbInstance from '@/database/pg';
import type DatabaseShape from '@/types/models/Database';
import { type Kysely } from 'kysely';

export default class DefaultModel {
  private tableName: keyof DatabaseShape;
  private db: Kysely<DatabaseShape>;
  constructor(tableName: keyof DatabaseShape) {
    this.tableName = tableName;
    this.db = dbInstance.getDb;
  }
  /**
   *
   * @param criteria Record<string, any> - criteria to know which row update
   * @param values Record<string, any> - value to update
   */
  public update(criteria: Record<string, any>, values: Record<string, any>) {
    const expressions = Object.entries(criteria).map(([col, cond]) => {
      if (cond && typeof cond === 'object' && 'not' in cond) {
        return [`${col}`, '!=', (cond as any).not] as const;
      } else if (cond && typeof cond === 'object' && 'are' in cond) {
        return [`${col}`, 'in', (cond as any).are] as const;
      } else {
        return [`${col}`, '=', cond as any] as const;
      }
    });

    return this.db
      .updateTable(this.tableName)
      .set(values)
      .where(eb => eb.and(expressions.map(([col, op, val]) => eb(col as any, op as any, eb.val(val)))));
  }
}
