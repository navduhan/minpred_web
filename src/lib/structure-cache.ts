import fs from 'fs/promises';
import path from 'path';
import { createHash, randomUUID } from 'crypto';
import { readPredictionJob } from './prediction-jobs';
import { PREDICTION_CONFIG } from './config';

export type StructureKind = 'secondary' | 'tertiary';
const pending = new Map<string, Promise<unknown>>();
// Recover abandoned locks after a container interruption; this exceeds the
// maximum combined ESMFold retries and SWISS-MODEL polling duration.
async function expireLock(lock: string) {
  try {
    const stat = await fs.stat(lock);
    if (Date.now() - stat.mtimeMs > 2 * 60 * 60 * 1000) await fs.unlink(lock);
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
}
const digest = (sequence: string) => createHash('sha256').update(sequence).digest('hex');
function directory(jobId: string) {
  if (!/^[a-z0-9_-]+$/i.test(jobId)) throw new Error('Invalid job identifier.');
  return path.join(PREDICTION_CONFIG.jobDir, jobId, 'structures');
}
export async function cachedStructure<T>(jobId: string, sequence: string, kind: StructureKind, predict: () => Promise<T>): Promise<T> {
  const dir = directory(jobId);
  const target = path.join(dir, `${digest(sequence)}.${kind}.json`);
  try { return JSON.parse(await fs.readFile(target, 'utf8')) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const existing = pending.get(target);
  if (existing) return existing as Promise<T>;
  const task = (async () => {
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    const lock = `${target}.lock`;
    await expireLock(lock);
    try { await fs.writeFile(lock, '', { flag: 'wx', mode: 0o600 }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('This structure is already being predicted. Please check again shortly.');
      throw error;
    }
    try {
      const value = await predict();
      const temp = `${target}.${randomUUID()}.tmp`;
      await fs.writeFile(temp, JSON.stringify(value), { mode: 0o600 });
      await fs.rename(temp, target);
      return value;
    } finally { await fs.unlink(lock); }
  })();
  pending.set(target, task);
  try { return await task; } finally { pending.delete(target); }
}

export async function structureStatus(jobId: string) {
  const dir = directory(jobId);
  const entries = new Set(await fs.readdir(dir).catch((error: NodeJS.ErrnoException) => { if (error.code === 'ENOENT') return []; throw error; }));
  for (const entry of entries) {
    if (!entry.endsWith('.lock')) continue;
    await expireLock(path.join(dir, entry));
    try { await fs.stat(path.join(dir, entry)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') entries.delete(entry); else throw error; }
  }
  const record = await readPredictionJob(jobId);
  const fasta = await fs.readFile(path.join(PREDICTION_CONFIG.jobDir, jobId, record.sequenceType==='nucl'?'translated_proteins.fasta':'input.fasta'), 'utf8');
  const result: Record<string, { secondary: string; tertiary: string }> = {};
  for (const record of fasta.split(/^>/m).slice(1)) {
    const lines = record.split(/\r?\n/);
    const id = lines.shift()!.trim().split(/\s+/)[0];
    const hash = digest(lines.join('').replace(/\s+/g, '').toUpperCase().replace(/X/g, ''));
    const state = (kind: StructureKind) => entries.has(`${hash}.${kind}.json`) ? 'ready' : entries.has(`${hash}.${kind}.json.lock`) ? 'running' : 'missing';
    result[id] = { secondary: state('secondary'), tertiary: state('tertiary') };
  }
  return result;
}
