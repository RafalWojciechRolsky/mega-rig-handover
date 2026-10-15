import { sortRowsByJob } from '../digest/sort.js';
import type { DigestRow, NightDigest } from '../digest/types.js';

function Row({ row }: { row: DigestRow }) {
  return (
    <tr>
      <td>{row.job}</td>
      <td>{row.owner ?? <span class="mute">—</span>}</td>
      <td>{row.runs}</td>
      <td class={row.retries >= 3 ? 'warn' : undefined}>{row.retries}</td>
      <td class={row.lastStatus === 'fail' ? 'warn' : undefined}>{row.lastStatus}</td>
      <td>{row.lastError ?? <span class="mute">—</span>}</td>
      <td>{row.firstAt}</td>
      <td>{row.lastAt}</td>
    </tr>
  );
}

// plan.md § 2a. One table sorted by job; retries >= 3 and fail are marked `warn`.
// Times are rendered as logged, offset included. Missing owner/error render as —.
export function DigestPage({ digest }: { digest: NightDigest }) {
  const rows = sortRowsByJob(digest.rows);
  return (
    <>
      <h1>digest · {digest.night}</h1>
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first at</th>
              <th>last at</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row row={row} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
