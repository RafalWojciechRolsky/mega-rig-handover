import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { RigConfig } from '../src/config.js';

// plan.md § 2d: route tests use a temp runs dir — runs/ stays read-only fixtures.
const NIGHT = '2026-10-28';
const GOOD = [
  { at: '2026-10-29T01:00:00+01:00', job: 'b/job', status: 'ok', owner: 'rook' },
  { at: '2026-10-29T01:05:00+01:00', job: 'a/job', status: 'retry', owner: null, error: 'lock' },
  { at: '2026-10-29T01:06:00+01:00', job: 'a/job', status: 'fail', owner: null, error: 'gave up' },
];

let runsDir: string;
let config: RigConfig;

beforeAll(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  writeFileSync(
    join(runsDir, `${NIGHT}.jsonl`),
    GOOD.map((r) => JSON.stringify(r)).join('\n') + '\n{"at":"2026-10-29T02:',
  );
  writeFileSync(join(runsDir, '2026-10-29.jsonl'), '');
  config = { adapter: 'shim', installed: 'x', beatEverySeconds: 60, runsDir };
});

describe('digest routes', () => {
  it('page renders rows sorted by job and marks fail', async () => {
    const res = await createApp(config).request(`/digest/${NIGHT}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    expect(html).toContain('fail');
    expect(html).toContain('—');
  });

  it('JSON returns the same jobs in the same order as the page', async () => {
    const res = await createApp(config).request(`/api/digest/${NIGHT}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: { job: string }[]; badLines: number };
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
    expect(body.badLines).toBe(1);
  });

  it('returns 404 for a night with no file', async () => {
    expect((await createApp(config).request('/digest/1999-01-01')).status).toBe(404);
    expect((await createApp(config).request('/api/digest/1999-01-01')).status).toBe(404);
  });

  it('renders "nothing ran" for an empty night', async () => {
    const res = await createApp(config).request('/digest/2026-10-29');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });
});
