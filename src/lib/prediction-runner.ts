import fs from 'fs/promises';
import path from 'path';
import { Client, type SFTPWrapper } from 'ssh2';
import { getSSHAuthOptions, PREDICTION_CONFIG } from './config';

export type ResultValue = string | number;
export type PredictionResults = Record<string, Record<string, ResultValue>[]>;
type PredictionRequest = { jobId: string; sequence: string; level: string; enzymeClass: string; sequenceType?: 'prot'|'nucl' };
type PredictionRun = { clusterJobId: string; executionMode: 'slurm'; results: PredictionResults };

const shellQuote = (value: string) => `'${value.replace(/'/g, `'"'"'`)}'`;
const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
const isResultFile = (file: string) => /^(?:Phase_[1-3]_dnn_log|Phase_4_[a-z]+_log|minpred_predictions)\.tsv$/.test(file);

class ClusterExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClusterExecutionError';
  }
}

function parseTsv(content: string) {
  const lines = content.replace(/\r/g, '').split('\n').filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const values = line.split('\t');
    return Object.fromEntries(headers.map((header, index) => {
      const raw = values[index] ?? '';
      const numeric = raw.trim() === '' ? Number.NaN : Number(raw);
      return [header, Number.isFinite(numeric) ? numeric : raw];
    }));
  });
}

function connectSSH() {
  return new Promise<Client>((resolve, reject) => {
    const client = new Client();
    client.once('ready', () => resolve(client));
    client.once('error', reject);
    client.connect(getSSHAuthOptions());
  });
}

function execRemote(client: Client, command: string) {
  return new Promise<string>((resolve, reject) => {
    client.exec(command, (error, stream) => {
      if (error) return reject(error);
      let stdout = '';
      let stderr = '';
      stream.on('data', (data: Buffer) => { stdout += data.toString(); });
      stream.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
      stream.on('close', (code: number | null) => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr.trim() || `Remote command failed with exit code ${code}.`)));
    });
  });
}

function execSbatchAndWait(client: Client, command: string) {
  return new Promise<{ clusterJobId: string; stderr: string }>((resolve, reject) => {
    client.exec(command, (error, stream) => {
      if (error) return reject(new ClusterExecutionError(error.message));
      let stdout = '';
      let stderr = '';
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const getJobId = () => stdout.match(/(?:^|\n)(\d+)(?:;[^\n]*)?/)?.[1] || '';
      const finishReject = (message: string) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        reject(new ClusterExecutionError(message));
      };
      if (PREDICTION_CONFIG.timeoutMs > 0) {
        timeout = setTimeout(() => {
          const clusterJobId = getJobId();
          stream.destroy();
          finishReject(
            clusterJobId
              ? `Timed out waiting for SLURM job ${clusterJobId}; the job may still be running.`
              : 'Timed out after sending the SLURM submission; job state is uncertain.',
          );
        }, PREDICTION_CONFIG.timeoutMs);
      }

      stream.on('data', (data: Buffer) => { stdout += data.toString(); });
      stream.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
      stream.on('error', (streamError: Error) => {
        const clusterJobId = getJobId();
        finishReject(
          clusterJobId
            ? `Lost the SSH command channel while waiting for SLURM job ${clusterJobId}: ${streamError.message}`
            : `Lost the SSH command channel after submission was sent: ${streamError.message}`,
        );
      });
      stream.on('close', (code: number | null) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        const clusterJobId = getJobId();
        if (typeof code !== 'number') {
          return reject(new ClusterExecutionError('The SSH command channel closed without a SLURM exit code.'));
        }
        if (code !== 0) {
          return reject(new ClusterExecutionError(
            `${clusterJobId ? `SLURM job ${clusterJobId}` : 'sbatch'} failed with exit code ${code}${stderr.trim() ? `: ${stderr.trim()}` : '.'}`,
          ));
        }
        if (!clusterJobId) return reject(new ClusterExecutionError('sbatch completed but did not return a parsable job ID.'));
        resolve({ clusterJobId, stderr: stderr.trim() });
      });
    });
  });
}

function openSftp(client: Client) {
  return new Promise<SFTPWrapper>((resolve, reject) => client.sftp((error, sftp) => error ? reject(error) : resolve(sftp)));
}

function sftpWrite(sftp: SFTPWrapper, remotePath: string, content: string) {
  return new Promise<void>((resolve, reject) => sftp.writeFile(remotePath, Buffer.from(content), (error) => error ? reject(error) : resolve()));
}

function sftpChmod(sftp: SFTPWrapper, remotePath: string, mode: number) {
  return new Promise<void>((resolve, reject) => sftp.chmod(remotePath, mode, (error) => error ? reject(error) : resolve()));
}

function sftpRead(sftp: SFTPWrapper, remotePath: string) {
  return new Promise<string>((resolve, reject) => sftp.readFile(remotePath, (error, data) => error ? reject(error) : resolve(data.toString())));
}

function sftpList(sftp: SFTPWrapper, remotePath: string) {
  return new Promise<string[]>((resolve, reject) => sftp.readdir(remotePath, (error, entries) => error ? reject(error) : resolve(entries.map((entry) => entry.filename))));
}

async function collectRemoteResults(sftp: SFTPWrapper, outputDir: string): Promise<PredictionResults> {
  const files = (await sftpList(sftp, outputDir)).filter(isResultFile).sort();
  if (!files.length) throw new Error('SLURM job completed without producing result files.');
  const results: PredictionResults = {};
  for (const file of files) results[file] = parseTsv(await sftpRead(sftp, `${outputDir}/${file}`));
  return results;
}

async function runOnCluster(request: PredictionRequest): Promise<PredictionRun> {
  const client = await connectSSH();
  let sftp: SFTPWrapper | undefined;
  try {
    const remoteRoot = PREDICTION_CONFIG.cluster.remoteTmpDir.replace(/\/$/, '');
    const remoteInput = `${remoteRoot}/${request.jobId}.fasta`;
    const remoteOutput = `${remoteRoot}/${request.jobId}`;
    await execRemote(client, `umask 077; mkdir -p -- ${shellQuote(remoteOutput)}; chmod 700 -- ${shellQuote(remoteOutput)}`);
    sftp = await openSftp(client);
    await sftpWrite(sftp, remoteInput, request.sequence.trim());
    await sftpChmod(sftp, remoteInput, 0o600);

    const { clusterJobId } = await execSbatchAndWait(client, [
      'umask 077; sbatch --parsable --wait', `--chdir=${shellQuote(remoteOutput)}`,
      `--output=${shellQuote(`${remoteOutput}/slurm-%j.out`)}`,
      `--error=${shellQuote(`${remoteOutput}/slurm-%j.err`)}`,
      shellQuote(PREDICTION_CONFIG.cluster.remoteScript), shellQuote(remoteInput),
      shellQuote(request.level), shellQuote(request.enzymeClass), shellQuote(remoteOutput), shellQuote(request.sequenceType === 'nucl' ? 'nucleotide' : 'protein'),
    ].join(' '));
    try {
      const results = await collectRemoteResults(sftp, remoteOutput);
      if(request.sequenceType==='nucl') await fs.writeFile(path.join(PREDICTION_CONFIG.jobDir,request.jobId,'translated_proteins.fasta'),await sftpRead(sftp,`${remoteOutput}/translated_proteins.fasta`),{mode:0o600});
      await execRemote(client, `rm -rf -- ${shellQuote(remoteInput)} ${shellQuote(remoteOutput)}`).catch((cleanupError) => {
        console.warn(`SLURM job ${clusterJobId} succeeded, but remote cleanup failed: ${errorMessage(cleanupError)}`);
      });
      return { clusterJobId, executionMode: 'slurm', results };
    } catch (error: unknown) {
      throw new ClusterExecutionError(`SLURM job ${clusterJobId} completed but its results could not be retrieved: ${errorMessage(error)}`);
    }
  } finally {
    sftp?.end();
    client.end();
  }
}

export async function executePrediction(request: PredictionRequest): Promise<PredictionRun> {
  return runOnCluster(request);
}
