import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, NightDigest, RunStatus } from './types.js';

type RunEntry = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

function parseLine(line: string): RunEntry | null {
  try {
    const v = JSON.parse(line) as Partial<RunEntry>;
    if (
      typeof v.at !== 'string' ||
      typeof v.job !== 'string' ||
      (v.status !== 'ok' && v.status !== 'retry' && v.status !== 'fail') ||
      (v.owner !== null && typeof v.owner !== 'string')
    ) {
      return null;
    }
    return v as RunEntry;
  } catch {
    return null;
  }
}

// Reads runs/<night>.jsonl into one row per job, in first-seen order.
// Lines that don't parse are counted in badLines, never thrown.
// Returns null when the night has no file.
export function readNight(runsDir: string, night: string): NightDigest | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }

  const rows = new Map<string, DigestRow>();
  let badLines = 0;
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const entry = parseLine(line);
    if (entry === null) {
      badLines += 1;
      continue;
    }
    const row = rows.get(entry.job);
    if (row === undefined) {
      rows.set(entry.job, {
        job: entry.job,
        owner: entry.owner,
        runs: 1,
        retries: entry.status === 'retry' ? 1 : 0,
        lastStatus: entry.status,
        lastError: entry.error ?? null,
        firstAt: entry.at,
        lastAt: entry.at,
      });
    } else {
      row.runs += 1;
      if (entry.status === 'retry') row.retries += 1;
      row.lastStatus = entry.status;
      row.lastError = entry.error ?? null;
      row.lastAt = entry.at;
      if (entry.owner !== null) row.owner = entry.owner;
    }
  }
  return { night, rows: [...rows.values()], badLines };
}
