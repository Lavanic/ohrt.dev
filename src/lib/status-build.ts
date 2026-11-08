import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fetchStatus, GIST_ID, type Status } from './status';

const run = promisify(execFile);

async function fromGit(): Promise<Status> {
  const dir = await mkdtemp(path.join(tmpdir(), 'status-'));
  try {
    await run('git', ['clone', '--quiet', '--depth', '1', `https://gist.github.com/${GIST_ID}.git`, dir], {
      timeout: 20000,
    });
    const data = JSON.parse(await readFile(path.join(dir, 'status.json'), 'utf8'));
    if (!data.content) throw new Error('empty status');
    const { stdout } = await run('git', ['-C', dir, 'log', '-1', '--format=%cI']);
    return { face: data.face, content: data.content, updatedAt: new Date(stdout.trim()).toISOString() };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

let pending: Promise<Status> | undefined;

export function buildStatus(): Promise<Status> {
  pending ??= fromGit().catch((err) => {
    console.warn(`[status] git clone failed (${err}), trying the API`);
    return fetchStatus(15000);
  });
  return pending;
}
