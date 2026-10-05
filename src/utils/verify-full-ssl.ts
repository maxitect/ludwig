const LEGACY_SSL_MODES = /([?&]sslmode=)(?:require|prefer|verify-ca)(?=&|$)/;

export function verifyFullSsl(connectionString: string): string {
  return connectionString.replace(LEGACY_SSL_MODES, "$1verify-full");
}
