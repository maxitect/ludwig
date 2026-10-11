import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPage } from "@/components/auth/auth-page";
import { requestPasswordReset } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Forgot password | Ludwig." };

export default function ForgotPasswordPage() {
  return (
    <AuthPage top="Locked out" bottom="Forgot password">
      <AuthForm
        action={requestPasswordReset}
        next="/"
        sentKind="reset"
        submitLabel="Send reset link"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
        ]}
        links={[{ href: "/sign-in", label: "Back to sign in" }]}
      />
    </AuthPage>
  );
}
