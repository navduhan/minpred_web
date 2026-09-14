import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import type { ConnectConfig } from 'ssh2';

const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const nonNegativeInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const PREDICTION_CONFIG = {
  cluster: {
    host: process.env.BIOCLUSTER_HOST || '',
    port: positiveInteger(process.env.BIOCLUSTER_PORT, 22),
    username: process.env.BIOCLUSTER_USER || '',
    privateKeyPath: process.env.BIOCLUSTER_SSH_KEY_PATH,
    hostKeySha256: process.env.BIOCLUSTER_HOST_KEY_SHA256 || '',
    remoteScript: process.env.BIOCLUSTER_REMOTE_SCRIPT || '',
    remoteTmpDir: process.env.BIOCLUSTER_REMOTE_TMP_DIR || '',
  },
  timeoutMs: nonNegativeInteger(process.env.PREDICTION_TIMEOUT_MS, 0),
  jobDir: process.env.PREDICTION_JOB_DIR || path.join(os.tmpdir(), 'minpred-jobs'),
  jobRetentionMs: positiveInteger(process.env.PREDICTION_JOB_RETENTION_MS, 2592000000),
  sshKeepaliveIntervalMs: positiveInteger(process.env.SSH_KEEPALIVE_INTERVAL_MS, 15000),
  sshKeepaliveCountMax: positiveInteger(process.env.SSH_KEEPALIVE_COUNT_MAX, 4),
  maxActiveJobs: positiveInteger(process.env.PREDICTION_MAX_ACTIVE_JOBS, 10),
  maxActiveJobsPerClient: positiveInteger(process.env.PREDICTION_MAX_ACTIVE_JOBS_PER_CLIENT, 2),
  structure: {
    s4predScript: process.env.S4PRED_SCRIPT || path.join(process.cwd(), 's4pred', 'run_model.py'),
    s4predPython: process.env.S4PRED_PYTHON || (fs.existsSync('/Users/naveen/miniconda3/envs/deepml/bin/python') ? '/Users/naveen/miniconda3/envs/deepml/bin/python' : 'python3'),
    swissModelToken: process.env.SWISS_MODEL_TOKEN || '',
  },
};

export function getSSHAuthOptions() {
  const { host, port, username, privateKeyPath, hostKeySha256, remoteScript, remoteTmpDir } = PREDICTION_CONFIG.cluster;
  if (!host || !username) throw new Error('BIOCLUSTER_HOST and BIOCLUSTER_USER must be configured.');
  if (!hostKeySha256) throw new Error('BIOCLUSTER_HOST_KEY_SHA256 must pin the verified cluster SSH host key.');
  if (!remoteScript || !remoteTmpDir) throw new Error('BIOCLUSTER_REMOTE_SCRIPT and BIOCLUSTER_REMOTE_TMP_DIR must be configured.');

  const expectedHostKey = hostKeySha256.replace(/^SHA256:/, '').replace(/=+$/, '');

  const options: ConnectConfig = {
    host,
    port,
    username,
    readyTimeout: 20000,
    keepaliveInterval: PREDICTION_CONFIG.sshKeepaliveIntervalMs,
    keepaliveCountMax: PREDICTION_CONFIG.sshKeepaliveCountMax,
    hostVerifier: (key: Buffer) => {
      const actual = crypto.createHash('sha256').update(key).digest('base64').replace(/=+$/, '');
      const expectedBuffer = Buffer.from(expectedHostKey);
      const actualBuffer = Buffer.from(actual);
      return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    },
  };
  if (!privateKeyPath) throw new Error('BIOCLUSTER_SSH_KEY_PATH must reference the dedicated cluster SSH key.');
  if (!fs.existsSync(privateKeyPath)) throw new Error(`SSH private key is not readable at ${privateKeyPath}.`);
  options.privateKey = fs.readFileSync(privateKeyPath);
  return options;
}
