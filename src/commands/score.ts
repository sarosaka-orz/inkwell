/**
 * Small subsequence matcher for the command palette. Returns null when the
 * query is not a subsequence, otherwise a score where consecutive and
 * word-boundary matches rank higher.
 */
export function fuzzyScore(query: string, text: string): number | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;
  const haystack = text.toLowerCase();

  let score = 0;
  let queryIndex = 0;
  let previous = -2;

  for (let index = 0; index < haystack.length && queryIndex < needle.length; index++) {
    if (haystack[index] !== needle[queryIndex]) continue;

    score += 1;
    if (index === previous + 1) score += 3;
    if (index === 0 || /[\s/._-]/.test(haystack[index - 1])) score += 2;

    previous = index;
    queryIndex++;
  }

  return queryIndex === needle.length ? score : null;
}

export function bestScore(query: string, ...texts: (string | undefined)[]): number | null {
  let best: number | null = null;
  for (const text of texts) {
    if (!text) continue;
    const score = fuzzyScore(query, text);
    if (score !== null && (best === null || score > best)) best = score;
  }
  return best;
}
