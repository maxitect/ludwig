import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPage } from "@/components/auth/auth-page";
import { resetPassword } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Reset password | Ludwig." };

async function ResetForm({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token, error } = await searchParams;
  const tokenValue = Array.isArray(token) ? token[0] : token;
  if (error || !tokenValue) {
    return (
      <div className="flex flex-col gap-5">
        <p role="alert" className="border-2 border-border bg-destructive p-3 text-destructive-foreground">
          This reset link has expired or isn&apos;t valid.
        </p>
        <Link href="/forgot-password" className="underline underline-offset-4">
          Ask for a new link
        </Link>
      </div>
    );
  }
  return (
    <AuthForm
      action={resetPassword}
      next="/"
      hidden={{ token: tokenValue }}
      sentKind="reset"
      submitLabel="Reset password"
      fields={[
        { name: "password", label: "New password", type: "password", autoComplete: "new-password" },
        { name: "confirmPassword", label: "Confirm new password", type: "password", autoComplete: "new-password" },
      ]}
      links={[]}
    />
  );
}

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <AuthPage top="New start" bottom="Reset password">
      <Suspense fallback={<p>Loading</p>}>
        <ResetForm searchParams={searchParams} />
      </Suspense>
    </AuthPage>
  );
}
