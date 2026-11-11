import "server-only";
import { Link } from "react-email";
import { EmailButton, EmailLayout, EmailParagraph } from "../layout";
import { EMAIL_COLOURS } from "../tokens";

export type DigestPuzzle = { title: string; typeName: string; url: string };

type FavouriteDigestProps = {
  name: string;
  puzzles: DigestPuzzle[];
  milestoneDays: number | null;
  url: string;
  unsubscribeUrl: string;
};

export const favouriteDigestSubject = ({
  puzzles,
  milestoneDays,
}: Pick<FavouriteDigestProps, "puzzles" | "milestoneDays">) =>
  puzzles.length === 0
    ? `${milestoneDays} days in a row on Ludwig.`
    : puzzles.length === 1
      ? "A new puzzle in a type you follow"
      : `${puzzles.length} new puzzles in the types you follow`;

export function FavouriteDigest({
  name,
  puzzles,
  milestoneDays,
  url,
  unsubscribeUrl,
}: FavouriteDigestProps) {
  return (
    <EmailLayout
      preview={
        puzzles.length > 0
          ? "New puzzles in your favourite types."
          : "Your streak has reached a milestone."
      }
    >
      <EmailParagraph>Hello {name}.</EmailParagraph>
      {milestoneDays !== null && (
        <EmailParagraph>
          You have solved something every day for {milestoneDays} days. Well
          done.
        </EmailParagraph>
      )}
      {puzzles.length > 0 && (
        <>
          <EmailParagraph>New in the types you follow:</EmailParagraph>
          {puzzles.map((puzzle) => (
            <EmailParagraph key={puzzle.url}>
              <Link href={puzzle.url} style={{ color: EMAIL_COLOURS.ink }}>
                {puzzle.title}
              </Link>{" "}
              ({puzzle.typeName})
            </EmailParagraph>
          ))}
        </>
      )}
      <EmailButton href={url}>Open Ludwig.</EmailButton>
      <EmailParagraph>
        <Link href={unsubscribeUrl} style={{ color: EMAIL_COLOURS.crayon }}>
          Stop these emails
        </Link>
      </EmailParagraph>
    </EmailLayout>
  );
}

export const favouriteDigest = (props: FavouriteDigestProps) => ({
  subject: favouriteDigestSubject(props),
  react: <FavouriteDigest {...props} />,
});
