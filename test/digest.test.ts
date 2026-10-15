import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/reader.js';

describe('run log reader', () => {
  const night = readNight('runs', '2026-10-28');

  it('reads the night fixture into one row per job', () => {
    expect(night).not.toBeNull();
    expect(night!.rows.map((r) => r.job)).toEqual([
      'rig/rotate-logs',
      'lane/sync',
      'fixtures/refresh',
      'notes/backup',
      'digest/render',
    ]);
    expect(night!.badLines).toBe(1);
  });

  it('aggregates runs, retries, last status and error', () => {
    const refresh = night!.rows.find((r) => r.job === 'fixtures/refresh')!;
    expect(refresh.runs).toBe(4);
    expect(refresh.retries).toBe(3);
    expect(refresh.lastStatus).toBe('ok');
    expect(refresh.lastError).toBeNull();
    const backup = night!.rows.find((r) => r.job === 'notes/backup')!;
    expect(backup.lastStatus).toBe('fail');
    expect(backup.lastError).toBe('quota exceeded');
  });

  it('keeps rows with owner null and first/last times', () => {
    const render = night!.rows.find((r) => r.job === 'digest/render')!;
    expect(render.owner).toBeNull();
    expect(render.firstAt).toBe('2026-10-29T05:41:09+01:00');
    expect(render.lastAt).toBe('2026-10-29T05:41:09+01:00');
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
    expect(readNight('runs', '../etc')).toBeNull();
  });
});
