import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";

type AuthPageProps = { top: string; bottom: string; children: ReactNode };

export function AuthPage({ top, bottom, children }: AuthPageProps) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-12">
      <Wordmark variant="ink-splat" className="w-full max-w-64" />
      <Card className="w-full">
        <CardContent className="flex flex-col gap-8">
          <h1 className="font-display uppercase tracking-[0.04em]">
            <span className="block text-lg font-light">{top}</span>
            <span className="block text-4xl font-bold">{bottom}</span>
          </h1>
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
