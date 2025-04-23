import dbInstance from '@/database/pg';
import type Database from '@/types/models/Database';
import { compare } from 'bcryptjs';
import { type Selectable } from 'kysely';

export default class UsersModel extends dbInstance.BaseModel('users', 'id') {
  private data: Selectable<Database['users']>;

  private constructor(data: Selectable<Database['users']>) {
    super();
    this.data = data;
  }
  static findByEmail(email: string, isoAuth: boolean = false) {
    return this.selectFrom()
      .where('email', '=', email)
      .where('password', isoAuth ? 'is not' : 'is', null);
  }

  static async findLogin(email: string) {
    const row = await dbInstance.getDb
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .where('password', 'is not', null)
      .executeTakeFirst();
    if (!row) return undefined;
    return new UsersModel(row);
  }

  async checkPassword(plain: string): Promise<boolean> {
    if (this.data.password === null) return false;
    return compare(plain, this.data.password);
  }
}
