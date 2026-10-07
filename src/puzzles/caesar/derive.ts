const A = "a".charCodeAt(0);

/** Shifts each letter forward by `shift` places, wrapping past Z. The result is uppercase and non-letters pass through. */
export function deriveCiphertext(plaintext: string, shift: number) {
  return plaintext.replace(/[a-z]/gi, (letter) =>
    String.fromCharCode(
      A + ((letter.toLowerCase().charCodeAt(0) - A + shift) % 26),
    ).toUpperCase(),
  );
}
