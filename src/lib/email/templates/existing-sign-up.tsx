import "server-only";
import { EmailLayout, EmailParagraph } from "../layout";

export const existingSignUpSubject = "Someone tried to sign up with your email";

export function ExistingSignUp({ name }: { name: string }) {
  return (
    <EmailLayout preview="Nothing has changed on your account.">
      <EmailParagraph>
        Hello {name}. Someone tried to create a Ludwig. account with your
        address, which already has one. Nothing has changed. If it was you,
        sign in, or use &quot;Forgot password&quot; if you can&apos;t remember
        your password.
      </EmailParagraph>
    </EmailLayout>
  );
}

export const existingSignUp = ({ name }: { name: string }) => ({
  subject: existingSignUpSubject,
  react: <ExistingSignUp {...{ name }} />,
});
