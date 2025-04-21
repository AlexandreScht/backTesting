#!/usr/bin/env ts-node

import { spawnSync } from 'child_process';
import { promises as fs } from 'fs';
import { copyFile, readFile, writeFile } from 'fs/promises';
import path from 'path';
import promptSync from 'prompt-sync';
import { migrate } from './migrate';

const prompt = promptSync({ sigint: true });

async function createTempCopy(originalPath: string): Promise<string> {
  const dir = path.dirname(originalPath);
  const ext = path.extname(originalPath);
  const base = path.basename(originalPath, ext);
  const tmpPath = path.join(dir, `${base}.tmp${ext}`);
  await copyFile(originalPath, tmpPath);
  return tmpPath;
}

function openInEditor(filePath: string): void {
  const result = spawnSync('code', ['--wait', filePath], {
    stdio: 'inherit',
    shell: true,
  });
  if (result.error) throw result.error;
}

async function applyEdits(tmpPath: string, originalPath: string): Promise<void> {
  const edited = await readFile(tmpPath, 'utf-8');
  await writeFile(originalPath, edited, 'utf-8');
}

async function ensureMigrationExists(migrationsDir: string): Promise<void> {
  const files = (await fs.readdir(migrationsDir)).filter(f => /\.(js|ts)$/.test(f));
  if (files.length === 0) {
    const res = spawnSync('npm', ['run', 'make:migration first'], {
      stdio: 'inherit',
      shell: true,
    });
    if (res.error || res.status !== 0) process.exit(1);
  }
}

async function processFile(originalPath: string, originalContent: string, tmpPath?: string): Promise<void> {
  // Créer la copie temporaire une seule fois
  if (!tmpPath) tmpPath = await createTempCopy(originalPath);

  // Gestion du Ctrl+C : restauration et suppression temp
  process.once('SIGINT', async () => {
    await writeFile(originalPath, originalContent, 'utf-8');
    try {
      await fs.unlink(tmpPath!);
    } catch {}
    process.exit(0);
  });

  openInEditor(tmpPath);
  await applyEdits(tmpPath, originalPath);

  try {
    await migrate(true);
  } catch (error) {
    return processFile(originalPath, originalContent, tmpPath);
  }

  try {
    console.log('here');
    await migrate();
  } catch (error) {
    console.log('error');
    console.log(error);
  }

  // try {
  //   await migrate();
  // } catch {
  //   try {
  //     await migrate();
  //   } catch {
  //     await writeFile(originalPath, originalContent, 'utf-8');
  //     try {
  //       await fs.unlink(tmpPath);
  //     } catch {}
  //     process.exit(1);
  //   }
  //   return processFile(originalPath, originalContent, tmpPath);
  // }

  // // Succès : suppression de la copie temporaire
  // try {
  //   await fs.unlink(tmpPath);
  // } catch {}
}

async function main() {
  const migrationsDir = path.resolve(__dirname, 'migrations');
  await ensureMigrationExists(migrationsDir);

  const files = (await fs.readdir(migrationsDir)).filter(f => /\.(js|ts)$/.test(f)).sort();
  const originalPath = path.join(migrationsDir, files[files.length - 1]);
  const originalContent = await readFile(originalPath, 'utf-8');

  await processFile(originalPath, originalContent);
}

main().catch(() => process.exit(1));
