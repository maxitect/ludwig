const ORIGIN = "http://localhost";

/** Returns `path` only if it is a same-origin relative path, otherwise `/`. */
export function safeRedirectPath(path: FormDataEntryValue | null | undefined) {
  if (typeof path !== "string" || !path.startsWith("/") || path.includes("\\")) {
    return "/";
  }
  try {
    return new URL(path, ORIGIN).origin === ORIGIN ? path : "/";
  } catch {
    return "/";
  }
}
