import dbInstance from '@/database/pg';

export default class UsersModel extends dbInstance.BaseModel('users', 'id') {
  static findByEmail(email: string) {
    return this.findOne('first_name', email);
  }
}
