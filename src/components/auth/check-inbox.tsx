"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerification, type AuthFormState } from "@/lib/actions/auth";

type CheckInboxProps = {
  kind: "verify" | "reset";
  email: string;
  next: string;
};

const initialState: AuthFormState = { fieldErrors: {}, values: {} };

export function CheckInbox({ kind, email, next }: CheckInboxProps) {
  const [state, formAction, pending] = useActionState(
    resendVerification,
    initialState,
  );

  if (kind === "reset") {
    return (
      <div className="flex flex-col gap-5">
        <p role="status">
          If there&apos;s an account for that email, we&apos;ve sent a link to
          reset your password.
        </p>
        <Link href="/sign-in" className="underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p role="status">
        Check your inbox. We&apos;ve sent a link to {email}.
      </p>
      {state.formError && (
        <p
          role="alert"
          className="border-2 border-border bg-destructive p-3 text-destructive-foreground"
        >
          {state.formError}
        </p>
      )}
      {state.sentTo && <p role="status">Sent again.</p>}
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <Button type="submit" variant="secondary" disabled={pending}>
        Resend link
      </Button>
      <Link href="/sign-in" className="underline underline-offset-4">
        Back to sign in
      </Link>
    </form>
  );
}
