import dbInstance from '@/database/pg';

export default class UsersModel extends dbInstance.BaseModel('users', 'id') {
  static findByEmail(email: string, isoAuth?: boolean) {
    return !isoAuth ? this.findOne('email', email) : this.selectFrom().selectAll().where('email', '=', email).where('password', 'is', null);
  }
}
