#!/usr/bin/env ts-node

import chalk from 'chalk';
import { spawnSync } from 'child_process';
import { promises as fs } from 'fs';
import { copyFile, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { migrate } from './migrate';

async function createTempCopy(originalPath: string): Promise<string> {
  const dir = path.dirname(originalPath);
  const ext = path.extname(originalPath);
  const base = path.basename(originalPath, ext);
  const tmpPath = path.join(dir, `../${base}.tmp${ext}`);
  await copyFile(originalPath, tmpPath);
  return tmpPath;
}

function openInEditor(filePath: string): void {
  console.debug(chalk.blue.bold('ℹ️  Laisser le fichier complètement vide pour interrompre le code.'));
  const result = spawnSync('code', ['--wait', filePath], {
    stdio: 'inherit',
    shell: true,
  });
  if (result.error) throw result.error;
}

async function applyEdits(tmpPath: string, originalPath: string): Promise<void> {
  const edited = await readFile(tmpPath, 'utf-8');
  if (edited.trim() === '') {
    console.debug(chalk.whiteBright('Fichier temporaire vide détecté. Suppression et interruption du processus.'));
    await fs.unlink(tmpPath);
    process.exit(0);
  }
  await writeFile(originalPath, edited, 'utf-8');
}

async function ensureMigrationExists(migrationsDir: string): Promise<boolean> {
  const files = (await fs.readdir(migrationsDir)).filter(f => /\.(js|ts)$/.test(f));
  if (!files?.length) {
    const res = spawnSync('npm', ['run', 'make:migration first'], {
      stdio: 'inherit',
      shell: true,
    });
    if (res.error || res.status !== 0) process.exit(1);
    return true;
  }
  return false;
}

function clearMigrationCache(migrationsDir: string) {
  Object.keys(require.cache)
    .filter(key => key.startsWith(migrationsDir))
    .forEach(key => delete require.cache[key]);
}

async function processFile(originalPath: string, originalContent: string, isFirst: boolean, tmpPath?: string): Promise<void> {
  // Créer la copie temporaire une seule fois
  if (!tmpPath) tmpPath = await createTempCopy(originalPath);

  // Gestion du Ctrl+C : restauration et suppression temp

  openInEditor(tmpPath);
  await applyEdits(tmpPath, originalPath);

  try {
    await migrate(true);
  } catch (error) {
    clearMigrationCache(path.resolve(__dirname, 'migrations'));
    return processFile(originalPath, originalContent, isFirst, tmpPath);
  }

  try {
    await migrate();
  } catch (error) {
    clearMigrationCache(path.resolve(__dirname, 'migrations'));
    if (isFirst) return processFile(originalPath, originalContent, isFirst, tmpPath);
    try {
      await writeFile(originalPath, originalContent, 'utf-8');
      console.debug(chalk.yellow('↩️ Réstauration de la migration'));
      const originalDebug = console.debug;
      console.debug = () => {};
      await migrate();
      console.debug = originalDebug;
      console.debug(chalk.green('↩✅ Migration restaurée'));
      clearMigrationCache(path.resolve(__dirname, 'migrations'));
      return processFile(originalPath, originalContent, isFirst, tmpPath);
    } catch (error) {
      console.error(error);
      console.debug(chalk.redBright('⛔️⛔️ Fichier Corrompu ⛔️⛔️'));
      process.exit(1);
    }
  }

  await fs.unlink(tmpPath);
}

async function main() {
  const migrationsDir = path.resolve(__dirname, 'migrations');
  const isFirst = await ensureMigrationExists(migrationsDir);

  const files = (await fs.readdir(migrationsDir)).filter(f => /\.(js|ts)$/.test(f)).sort();
  const originalPath = path.join(migrationsDir, files[files.length - 1]);
  const originalContent = await readFile(originalPath, 'utf-8');

  await processFile(originalPath, originalContent, isFirst);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
