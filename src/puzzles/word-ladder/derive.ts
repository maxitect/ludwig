/** The number of positions at which two words differ. Words of unequal length are never one step apart. */
export function letterDifferences(a: string, b: string) {
  if (a.length !== b.length) return Infinity;
  let differences = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) differences++;
  return differences;
}
