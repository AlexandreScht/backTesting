import dbConfig from '@/config/db';
import { AppDatabase } from '@/plugins/updater';
import type DatabaseShape from '@/types/models/Database';
import { logger } from '@/utils/logger';
import { PostgresDialect, sql } from 'kysely';
import { type Database as DatabaseOrm, type Model, updatedAt } from 'kysely-orm';
import { Pool } from 'pg';

class dbConnection {
  private static instance: dbConnection;
  private db: DatabaseOrm<DatabaseShape>;
  private alreadyConnected = false;

  constructor() {
    this.db = new AppDatabase<DatabaseShape>({
      dialect: new PostgresDialect({
        pool: async () => new Pool(dbConfig),
      }),
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
    const Base = this.db.model(tableName, idColumn);
    const typedBase = Base as unknown as Model<DatabaseShape, TableName, IdColumn>;
    return updatedAt<DatabaseShape, TableName, IdColumn, typeof typedBase>(typedBase, 'updated_at') as typeof Base;
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
