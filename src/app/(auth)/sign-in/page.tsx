import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Wordmark } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { signIn } from "@/lib/actions/auth";
import { safeRedirectPath } from "@/utils/safe-redirect-path";

async function SignInForm({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const { next } = await searchParams;
  return (
    <AuthForm
      action={signIn}
      next={safeRedirectPath(Array.isArray(next) ? next[0] : next)}
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
      alternate={{ href: "/sign-up", label: "No account? Sign up" }}
    />
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
