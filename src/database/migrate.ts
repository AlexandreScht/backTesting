#!/usr/bin/env ts-node

import dbConfig from '@/config/db';
import Database from '@/types/models/Database';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { processDatabase } from 'kanel';
import { makeKyselyHook } from 'kanel-kysely';
import { FileMigrationProvider, Kysely, Migrator, PostgresDialect } from 'kysely';
import path from 'path';
import { Pool } from 'pg';

export async function migrate(rollBack?: boolean) {
  // 1️⃣ Connexion DB
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new Pool(dbConfig) }),
  });

  // 2️⃣ Configuration du migrator
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.resolve(__dirname, 'migrations'),
    }),
  });

  if (rollBack) {
    try {
      console.log(chalk.yellow('🡆 Début du rollback'));
      const { error, results } = await migrator.migrateDown();
      const [{ migrationName, status }] = results || [];

      if (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`❌ ${migrationName} rollback => ${msg}`));
        throw new Error();
      } else if (!results || !results?.length) {
        console.log(chalk.cyan('ℹ️ aucun rollback à effectuer.'));
        return;
      } else {
        console.log(chalk.green('✅ Rollback appliqué sur :'));
        console.log(`   • ${chalk.magenta(migrationName)} → ${chalk.green(status)}`);
        return;
      }
    } catch (error) {
      //   TypeError: Cannot read properties of undefined (reading 'migrationName')
      // at migrate (C:\Users\alexa\CodeVStudio\backTesting\server\src\database\migrate.ts:33:16)
      // at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
      // at processFile (C:\Users\alexa\CodeVStudio\backTesting\server\src\database\migrate.conf.ts:62:5)
      // at main (C:\Users\alexa\CodeVStudio\backTesting\server\src\database\migrate.conf.ts:104:3)

      //! pareille pour le migrate
      console.log(error);
    }
  } else {
    console.log(chalk.yellow('🡆 Début de la migration'));
    const { error, results } = await migrator.migrateUp();
    const [{ migrationName, status }] = results || [];

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ ${migrationName} migration => ${msg}`));
      throw new Error();
    } else if (!results || !results?.length) {
      console.log(chalk.cyan('ℹ️ aucune migration à appliquer.'));
      return;
    } else {
      console.log(chalk.green('✅ Migrations appliquées :'));
      console.log(`   • ${chalk.magenta(migrationName)} → ${chalk.green(status)}`);
      console.log(chalk.yellow('🡆 Génération des types Kysely via Kanel…'));
      try {
        await processDatabase({
          connection: dbConfig,
          preDeleteOutputFolder: true,
          schemas: ['public'],
          outputPath: path.resolve(__dirname, '../src/types/models'),
          preRenderHooks: [makeKyselyHook()],
        });
        console.log(chalk.green('✅ Types générés avec succès.'));
        return;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(chalk.red(`❌ Échec de la génération des types : ${msg}`));
        throw new Error();
      }
    }
  }
}

// Point d’entrée
if (process.argv.includes('--trml')) {
  migrate(process.argv.includes('--down'))
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
