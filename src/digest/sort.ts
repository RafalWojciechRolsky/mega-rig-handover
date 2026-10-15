import type { DigestRow } from './types.js';

// Page order is by job (plan.md § 2a). Shared so the page and the JSON never disagree (ADR 0001).
export function sortRowsByJob(rows: DigestRow[]): DigestRow[] {
  return [...rows].sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0));
}
