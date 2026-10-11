import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Wordmark } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { signUp } from "@/lib/actions/auth";
import { safeRedirectPath } from "@/utils/safe-redirect-path";

async function SignUpForm({ searchParams }: Pick<PageProps<"/sign-up">, "searchParams">) {
  const { next } = await searchParams;
  return (
    <AuthForm
      action={signUp}
      sentKind="verify"
      next={safeRedirectPath(Array.isArray(next) ? next[0] : next)}
      submitLabel="Create account"
      fields={[
        { name: "name", label: "Name", type: "text", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "new-password",
        },
      ]}
      links={[{ href: "/sign-in", label: "Already registered? Sign in" }]}
    />
  );
}

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-12">
      <Wordmark variant="ink-splat" className="w-full max-w-64" />
      <Card className="w-full">
        <CardContent className="flex flex-col gap-8">
          <h1 className="font-display uppercase tracking-[0.04em]">
            <span className="block text-lg font-light">Join the case</span>
            <span className="block text-4xl font-bold">Sign up</span>
          </h1>
          <Suspense fallback={<p>Loading</p>}>
            <SignUpForm searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
