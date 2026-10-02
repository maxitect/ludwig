"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/lib/actions/auth";

type Field = {
  name: "name" | "email" | "password";
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
};

type AuthFormProps = {
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
  next: string;
  alternate: { href: string; label: string };
};

const initialState: AuthFormState = { fieldErrors: {}, values: {} };

export function AuthForm({
  action,
  fields,
  submitLabel,
  next,
  alternate,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
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
              defaultValue={name === "password" ? undefined : state.values[name]}
              aria-invalid={errors ? true : undefined}
              aria-describedby={errors ? `${name}-error` : undefined}
            />
            {errors && (
              <p
                id={`${name}-error`}
                className="text-sm font-semibold underline decoration-2 underline-offset-4"
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
      <Link href={alternate.href} className="underline underline-offset-4">
        {alternate.label}
      </Link>
    </form>
  );
}
