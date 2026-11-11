import "server-only";
import { Link } from "react-email";
import { EmailButton, EmailLayout, EmailParagraph } from "../layout";
import { EMAIL_COLOURS } from "../tokens";

type StreakNudgeProps = {
  name: string;
  streak: number;
  url: string;
  unsubscribeUrl: string;
};

export const streakNudgeSubject = (streak: number) =>
  `Your ${streak}-day streak ends at midnight`;

export function StreakNudge({
  name,
  streak,
  url,
  unsubscribeUrl,
}: StreakNudgeProps) {
  return (
    <EmailLayout preview="One puzzle keeps it going.">
      <EmailParagraph>
        Hello {name}. Your streak is {streak} days and ends at midnight. One
        solve today keeps it going.
      </EmailParagraph>
      <EmailButton href={url}>Solve today&apos;s puzzle</EmailButton>
      <EmailParagraph>
        <Link href={unsubscribeUrl} style={{ color: EMAIL_COLOURS.crayon }}>
          Stop these reminders
        </Link>
      </EmailParagraph>
    </EmailLayout>
  );
}

export const streakNudge = (props: StreakNudgeProps) => ({
  subject: streakNudgeSubject(props.streak),
  react: <StreakNudge {...props} />,
});
