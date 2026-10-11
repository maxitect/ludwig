import "server-only";
import { EmailButton, EmailLayout, EmailParagraph } from "../layout";

export const resetPasswordSubject = "Reset your Ludwig. password";

export function ResetPassword({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout preview="Choose a new password.">
      <EmailParagraph>
        Hello {name}. Someone asked to reset the password on this account. If
        that was you, use the button below. If not, ignore this email.
      </EmailParagraph>
      <EmailButton href={url}>Reset password</EmailButton>
    </EmailLayout>
  );
}

export const resetPassword = ({ name, url }: { name: string; url: string }) => ({
  subject: resetPasswordSubject,
  react: <ResetPassword {...{ name, url }} />,
});
