import { withBasePath } from './base-path';

export type JobBookmark = { jobId: string; jobToken: string };

export function buildJobBookmark(job: JobBookmark) {
  const fragment = new URLSearchParams({ job: job.jobId, token: job.jobToken });
  return `${window.location.origin}${withBasePath('/results')}#${fragment.toString()}`;
}

export function readJobBookmark(): JobBookmark | null {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const jobId = fragment.get('job') || '';
  const jobToken = fragment.get('token') || '';
  return jobId && jobToken ? { jobId, jobToken } : null;
}

export function expiresAt(date: string) {
  return new Date(new Date(date).getTime() + 30 * 24 * 60 * 60 * 1000);
}
