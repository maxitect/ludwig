import { attemptSchema as anagramAttempt } from "./anagram/schema";
import { attemptSchema as crosswordAttempt } from "./crossword/schema";

/** Attempt schemas for the types that have a solver, importable from client code (the registry is not). */
const attemptSchemas = {
  anagram: anagramAttempt,
  crossword: crosswordAttempt,
} as const;

export function getAttemptSchema(typeKey: string) {
  return Object.hasOwn(attemptSchemas, typeKey)
    ? attemptSchemas[typeKey as keyof typeof attemptSchemas]
    : null;
}
