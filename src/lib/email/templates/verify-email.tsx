import "server-only";
import { EmailButton, EmailLayout, EmailParagraph } from "../layout";

export const verifyEmailSubject = "Verify your email for Ludwig.";

export function VerifyEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout preview="Confirm your email address.">
      <EmailParagraph>
        Hello {name}. Confirm your email address to finish creating your
        account. The link works for one hour.
      </EmailParagraph>
      <EmailButton href={url}>Verify email</EmailButton>
    </EmailLayout>
  );
}

export const verifyEmail = ({ name, url }: { name: string; url: string }) => ({
  subject: verifyEmailSubject,
  react: <VerifyEmail {...{ name, url }} />,
});
