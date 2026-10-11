"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, type PasswordFormState } from "@/lib/actions/settings";

const FIELDS = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  { name: "password", label: "New password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
] as const;

const initialState: PasswordFormState = { fieldErrors: {}, saved: false };

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  return (
    <form
      key={state.saved ? "saved" : "editing"}
      action={formAction}
      noValidate
      className="flex flex-col gap-5"
    >
      <h2 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
        Password
      </h2>
      {FIELDS.map(({ name, label, autoComplete }) => {
        const errors = state.fieldErrors[name];
        return (
          <div key={name} className="flex flex-col gap-1">
            <Label htmlFor={name}>{label}</Label>
            <Input
              id={name}
              name={name}
              type="password"
              autoComplete={autoComplete}
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
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          Change password
        </Button>
        {state.saved && (
          <p role="status" className="font-semibold">
            Password changed.
          </p>
        )}
      </div>
    </form>
  );
}
