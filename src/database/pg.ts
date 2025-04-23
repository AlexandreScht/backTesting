import dbConfig from '@/config/db';
import type DatabaseShape from '@/types/models/Database';
import { logger } from '@/utils/logger';
import { PostgresDialect, sql } from 'kysely';
import { Database as DatabaseOrm } from 'kysely-orm';
import { Pool } from 'pg';

class dbConnection {
  private static instance: dbConnection;
  private db: DatabaseOrm<DatabaseShape>;
  private alreadyConnected = false;

  constructor() {
    this.db = new DatabaseOrm<DatabaseShape>({
      dialect: new PostgresDialect({
        pool: async () => new Pool(dbConfig),
      }),
      log: event => event.level === 'error' && console.debug(event.error),
    });
  }

  public async dbConnection() {
    try {
      if (!this.alreadyConnected) {
        await sql<{ result: number }>`SELECT 1+1 AS result`.execute(this.db.db);
        console.debug(`          Connected to database "${dbConfig.database}"`);
      }
    } catch (error) {
      logger.error('Error connecting to the database:', error);
    }
  }

  get getDb() {
    return this.db.db;
  }

  public BaseModel<TableName extends keyof DatabaseShape & string, IdColumn extends keyof DatabaseShape[TableName] & string>(
    tableName: TableName,
    idColumn: IdColumn,
  ) {
    return this.db.model(tableName, idColumn);
  }

  public static getInstance(): dbConnection {
    if (!dbConnection.instance) {
      dbConnection.instance = new dbConnection();
    }
    return dbConnection.instance;
  }
}

const dbInstance = dbConnection.getInstance();
export default dbInstance;
