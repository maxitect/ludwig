export const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/** Plain letter guesses keyed by the lowercase cipher letter they stand for. */
export type Guesses = Readonly<Record<string, string>>;

/** The lowercase letters of `text`, without spaces, digits or punctuation. */
export function lettersOf(text: string) {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

/** The distinct lowercase letters of `ciphertext`, in alphabetical order. */
export function cipherLettersIn(ciphertext: string) {
  const present = new Set(lettersOf(ciphertext));
  return [...ALPHABET].filter((letter) => present.has(letter));
}

/** The letters of `ciphertext` as guessed so far, with "_" for each letter not yet guessed. */
export function decodeLetters(ciphertext: string, guesses: Guesses) {
  return [...lettersOf(ciphertext)]
    .map((letter) => guesses[letter] ?? "_")
    .join("");
}

/** Rebuilds guesses from a saved `decodeLetters` string. Anything that does not line up is dropped. */
export function guessesFromLetters(ciphertext: string, saved: string | null) {
  const guesses: Record<string, string> = {};
  const cipherLetters = lettersOf(ciphertext);
  if (!saved || saved.length !== cipherLetters.length) return guesses;
  [...cipherLetters].forEach((letter, index) => {
    const guess = saved[index];
    if (/^[a-z]$/.test(guess) && !(letter in guesses)) guesses[letter] = guess;
  });
  return guesses;
}

/** Whether every distinct cipher letter has a guess. */
export function isComplete(ciphertext: string, guesses: Guesses) {
  return cipherLettersIn(ciphertext).every((letter) => letter in guesses);
}

/** Plain letters that more than one cipher letter currently maps to. */
export function duplicatedGuesses(guesses: Guesses) {
  const seen = new Set<string>();
  const duplicated = new Set<string>();
  for (const guess of Object.values(guesses)) {
    (seen.has(guess) ? duplicated : seen).add(guess);
  }
  return duplicated;
}
