/** Returns `url` with `_test` appended to its database name. */
export function testDatabaseUrl(url: string) {
  const parsed = new URL(url);
  parsed.pathname = `${parsed.pathname}_test`;
  return parsed.toString();
}
