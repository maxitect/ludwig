import { bookTexts } from "../../../content/book-texts";
import { derivePlaintext, paginate } from "./derive";
import type { Content } from "./schema";

/** Every reference lands on a real word of the paginated text, and no word is referenced twice. */
export function verifyBookCipher({ textSlug, refs }: Content) {
  const text = bookTexts.find(({ meta }) => meta.slug === textSlug);
  if (!text) throw new Error(`no book text "${textSlug}" in content/book-texts`);
  derivePlaintext(paginate(text.paragraphs), refs);
  const places = refs.map(
    ({ page, line, wordIndex }) => `${page}:${line}:${wordIndex}`,
  );
  const repeated = places.find((place, i) => places.indexOf(place) !== i);
  if (repeated) throw new Error(`reference ${repeated} appears twice`);
}
