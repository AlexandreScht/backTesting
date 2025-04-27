import dbInstance from '@/database/pg';
import { type Services } from '@/interfaces/services';
import type Database from '@/types/models/Database';
import type UsersTable from '@/types/models/public/Users';
import { compare } from 'bcryptjs';
import DefaultModel from '.';

export default class UsersModel extends dbInstance.BaseModel('users', 'id') {
  private data: Database['users'];

  private constructor(data: Database['users']) {
    super();
    this.data = data;
  }
  static findByEmail(email: string, isoAuth: boolean = false) {
    return this.selectFrom()
      .where('email', '=', email)
      .where('password', isoAuth ? 'is not' : 'is', null);
  }

  static queryModel() {
    return new DefaultModel(this.table);
  }

  static async getUser(field: Services.Users.findProps) {
    let query = dbInstance.getDb.selectFrom('users').selectAll();
    if ('email' in field) {
      query = query.where('email', '=', field.email).where('password', field?.isoAuth ? 'is not' : 'is', null);
    } else {
      query = query.where('id', '=', field.id);
    }
    if (!query) return undefined;
    return new UsersModel(await query.executeTakeFirst());
  }

  async checkPassword(plain: string): Promise<false | Pick<UsersTable, 'id' | 'role' | 'validate' | 'firstName'>> {
    if (this.data?.password === null) return false;
    const successPassword = compare(plain, this.data.password);
    if (!successPassword) return false;
    const { id, role, validate, firstName } = this.data;
    return { id, role, validate, firstName };
  }
}
