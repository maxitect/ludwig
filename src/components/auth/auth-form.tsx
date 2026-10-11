"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckInbox } from "@/components/auth/check-inbox";
import type { AuthFormState } from "@/lib/actions/auth";

type Field = {
  name: "name" | "email" | "password" | "confirmPassword";
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
};

type AuthFormProps = {
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
  next: string;
  hidden?: Record<string, string>;
  sentKind: "verify" | "reset";
  links: { href: string; label: string }[];
};

const initialState: AuthFormState = { fieldErrors: {}, values: {} };

export function AuthForm({
  action,
  fields,
  submitLabel,
  next,
  hidden,
  sentKind,
  links,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.sentTo) {
    return <CheckInbox kind={sentKind} email={state.sentTo} next={next} />;
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {state.formError && (
        <p
          role="alert"
          className="border-2 border-border bg-destructive p-3 text-destructive-foreground"
        >
          {state.formError}
        </p>
      )}
      {fields.map(({ name, label, type, autoComplete }) => {
        const errors = state.fieldErrors[name];
        return (
          <div key={name} className="flex flex-col gap-1">
            <Label htmlFor={name}>{label}</Label>
            <Input
              id={name}
              name={name}
              type={type}
              autoComplete={autoComplete}
              defaultValue={
                name === "name" || name === "email"
                  ? state.values[name]
                  : undefined
              }
              aria-invalid={errors ? true : undefined}
              aria-describedby={errors ? `${name}-error` : undefined}
            />
            {errors && (
              <p
                id={`${name}-error`}
                className="text-sm font-semibold text-destructive"
              >
                {errors.join(" ")}
              </p>
            )}
          </div>
        );
      })}
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
      {links.map(({ href, label }) => (
        <Link key={href} href={href} className="underline underline-offset-4">
          {label}
        </Link>
      ))}
    </form>
  );
}
