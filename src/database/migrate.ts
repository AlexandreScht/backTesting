#!/usr/bin/env ts-node

import chalk from 'chalk';
import { promises as fs } from 'fs';
import { processDatabase } from 'kanel';
import { kyselyTypeFilter, makeKyselyHook } from 'kanel-kysely';
import { FileMigrationProvider, Kysely, Migrator, PostgresDialect } from 'kysely';
import path from 'path';
import { Pool } from 'pg';
import { Writable } from 'stream';
import dbConfig from '../../src/config/db';
import type Database from '../../src/types/models/Database';

const bindOutput = () => {
  const devnull = new Writable({
    write(chunk, enc, cb) {
      cb();
    },
  });
  const originalStdout = process.stdout.write;
  const originalStderr = process.stderr.write;
  process.stdout.write = devnull.write.bind(devnull);
  process.stderr.write = devnull.write.bind(devnull);

  return { originalStdout, originalStderr };
};

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
      console.debug(chalk.yellow('🡆 Début du rollback'));
      const { error, results } = await migrator.migrateDown();

      if (!results || !results?.length) {
        console.debug(chalk.cyan('ℹ️ aucun rollback à effectuer.'));
        return;
      }

      const [{ migrationName, status }] = results || [];
      if (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`❌ ${migrationName} rollback => ${msg}`));
        throw new Error();
      }

      console.debug(chalk.green('✅ Rollback appliqué sur :'));
      console.debug(`   • ${chalk.magenta(migrationName)} → ${chalk.green(status)}`);
      return;
    } catch (error) {
      console.debug(error);
    }
  } else {
    console.debug(chalk.yellow('🡆 Début de la migration'));
    const { error, results } = await migrator.migrateUp();
    if (!results || !results?.length) {
      console.debug(chalk.cyan('ℹ️ aucune migration à appliquer.'));
      return;
    }
    const [{ migrationName, status }] = results || [];

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ ${migrationName} migration => ${msg}`));
      throw new Error();
    }
    console.debug(chalk.green('✅ Migrations appliquées :'));
    console.debug(`   • ${chalk.magenta(migrationName)} → ${chalk.green(status)}`);
    console.debug(chalk.yellow('🡆 Génération du typage de la database'));
    const { originalStdout, originalStderr } = bindOutput();
    try {
      await processDatabase({
        enumStyle: 'type',
        connection: dbConfig,
        preDeleteOutputFolder: true,
        schemas: ['public'],
        outputPath: path.resolve(__dirname, '../types/models'),
        typeFilter: kyselyTypeFilter,
        preRenderHooks: [makeKyselyHook()],
      });
      process.stdout.write = originalStdout;
      process.stderr.write = originalStderr;
      console.debug(chalk.green('✅ Types générés avec succès.'));
      return;
    } catch (e) {
      process.stdout.write = originalStdout;
      process.stderr.write = originalStderr;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(chalk.red(`❌ Échec de la génération des types : ${msg}`));
      throw new Error();
    }
  }
}

// Point d’entrée
if (process.argv.includes('--trml')) {
  migrate(process.argv.includes('--down'))
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
