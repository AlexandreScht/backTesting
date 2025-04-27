import { Database } from 'kysely-orm';
import unaccentPlugin from './unaccent';

export class AppDatabase<DB> extends Database<DB> {
  constructor(options: any) {
    const plugins = [...(options.plugins ?? []), unaccentPlugin];
    super({ ...options, plugins });
  }
}
