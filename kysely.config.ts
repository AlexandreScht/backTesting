import { CamelCasePlugin, DummyDriver, PostgresAdapter, PostgresDriver, PostgresIntrospector, PostgresQueryCompiler } from 'kysely';
import { defineConfig, getKnexTimestampPrefix } from 'kysely-ctl';
import { Pool } from 'pg';
import dbConfig from './src/config/db.ts';
import unaccentPlugin from './src/plugins/unaccent.ts';

export default defineConfig({
  dialect: {
    createAdapter() {
      return new PostgresAdapter();
    },
    createDriver() {
      if (process.env.NODE_ENV === 'test') {
        return new DummyDriver();
      }
      return new PostgresDriver({
        pool: new Pool(dbConfig),
      });
    },
    createIntrospector(db) {
      return new PostgresIntrospector(db);
    },
    createQueryCompiler() {
      return new PostgresQueryCompiler();
    },
  },
  migrations: {
    migrationFolder: 'src/database/migrations',
    getMigrationPrefix: getKnexTimestampPrefix,
    // allowJS: false,
  },
  plugins: [new CamelCasePlugin(), unaccentPlugin],
  seeds: {
    seedFolder: 'src/database/seeds',
    getSeedPrefix: getKnexTimestampPrefix,
    allowJS: false,
    provider: undefined,
    seeder: undefined,
  },
});
