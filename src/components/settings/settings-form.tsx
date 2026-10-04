"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { saveSettings, type SettingsFormState } from "@/lib/actions/settings";
import type { SettingsInput } from "@/lib/forms/settings";

const THEMES = [
  { value: "paper", label: "Paper" },
  { value: "ink", label: "Ink" },
  { value: "system", label: "System" },
] as const satisfies readonly { value: SettingsInput["theme"]; label: string }[];

const NOTATIONS = [
  { value: "algebraic", label: "Algebraic" },
  { value: "descriptive", label: "Descriptive" },
] as const satisfies readonly {
  value: SettingsInput["chessNotation"];
  label: string;
}[];

const MOTION = [
  { value: "off", label: "Off" },
  { value: "on", label: "On" },
] as const;

const initialState: SettingsFormState = { fieldErrors: {}, saved: false };

type Option<T extends string> = { value: T; label: string };

type ChoiceProps<T extends string> = {
  name: string;
  label: string;
  hint?: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  error?: string[];
};

function Choice<T extends string>({
  name,
  label,
  hint,
  options,
  value,
  onChange,
  error,
}: ChoiceProps<T>) {
  const labelId = `${name}-label`;
  return (
    <div className="flex flex-col gap-2">
      <Label id={labelId}>{label}</Label>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <input type="hidden" name={name} value={value} />
      <ToggleGroup
        type="single"
        aria-labelledby={labelId}
        value={value}
        onValueChange={(next) => {
          const match = options.find((option) => option.value === next);
          if (match) onChange(match.value);
        }}
      >
        {options.map(({ value: optionValue, label: optionLabel }) => (
          <ToggleGroupItem key={optionValue} value={optionValue}>
            {optionLabel}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {error && (
        <p role="alert" className="text-sm font-semibold underline decoration-2 underline-offset-4">
          {error.join(" ")}
        </p>
      )}
    </div>
  );
}

type SettingsFormProps = { initial: SettingsInput };

export function SettingsForm({ initial }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    saveSettings,
    initialState,
  );
  const [name, setName] = useState(initial.name);
  const [theme, setTheme] = useState(initial.theme);
  const [chessNotation, setChessNotation] = useState(initial.chessNotation);
  const [reduceMotion, setReduceMotion] = useState(initial.reduceMotion);
  const nameErrors = state.fieldErrors.name;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameErrors ? true : undefined}
          aria-describedby={nameErrors ? "name-error" : undefined}
        />
        {nameErrors && (
          <p
            id="name-error"
            className="text-sm font-semibold underline decoration-2 underline-offset-4"
          >
            {nameErrors.join(" ")}
          </p>
        )}
      </div>
      <Choice
        name="theme"
        label="Theme"
        options={THEMES}
        value={theme}
        onChange={setTheme}
        error={state.fieldErrors.theme}
      />
      <Choice
        name="chessNotation"
        label="Chess notation"
        hint="Used in the Reverse Chess move list."
        options={NOTATIONS}
        value={chessNotation}
        onChange={setChessNotation}
        error={state.fieldErrors.chessNotation}
      />
      <Choice
        name="reduceMotion"
        label="Reduce motion"
        hint="Also follows your device setting."
        options={MOTION}
        value={reduceMotion ? "on" : "off"}
        onChange={(next) => setReduceMotion(next === "on")}
      />
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          Save
        </Button>
        {state.saved && (
          <p role="status" className="font-semibold">
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}
