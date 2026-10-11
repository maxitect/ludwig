import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Wordmark } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { resendVerification, signIn } from "@/lib/actions/auth";
import { safeRedirectPath } from "@/utils/safe-redirect-path";

async function SignInForm({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const { next, error, reset } = await searchParams;
  const safeNext = safeRedirectPath(Array.isArray(next) ? next[0] : next);
  if (error === "verification") {
    return (
      <div className="flex flex-col gap-5">
        <p role="alert" className="border-2 border-border bg-destructive p-3 text-destructive-foreground">
          That verification link has expired or isn&apos;t valid. Enter your
          email and we&apos;ll send a new one.
        </p>
        <AuthForm
          action={resendVerification}
          next={safeNext}
          submitLabel="Send a new link"
          sentKind="verify"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
          ]}
          links={[{ href: "/sign-in", label: "Back to sign in" }]}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {reset && (
        <p role="status" className="border-2 border-border p-3">
          Your password has been reset. Sign in with the new one.
        </p>
      )}
    <AuthForm
      action={signIn}
      sentKind="verify"
      next={safeNext}
      submitLabel="Sign in"
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "current-password",
        },
      ]}
      links={[
        { href: "/forgot-password", label: "Forgot your password?" },
        { href: "/sign-up", label: "No account? Sign up" },
      ]}
    />
    </div>
  );
}

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-12">
      <Wordmark variant="ink-splat" className="w-full max-w-64" />
      <Card className="w-full">
        <CardContent className="flex flex-col gap-8">
          <h1 className="font-display uppercase tracking-[0.04em]">
            <span className="block text-lg font-light">Welcome back</span>
            <span className="block text-4xl font-bold">Sign in</span>
          </h1>
          <Suspense fallback={<p>Loading</p>}>
            <SignInForm searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
