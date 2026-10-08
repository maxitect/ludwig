"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  decodeLetters,
  isComplete,
  type Guesses,
} from "../_shared/cipher-key/cipher-key";
import { CipherKeyPanel } from "../_shared/cipher-key/cipher-key-panel";
import type { SolverProps } from "../solver-types";
import { glyphCipher, symbolName } from "./derive";
import type * as schema from "./schema";

/** A glyph drawn in the current ink colour, through its neutral asset file. */
function Glyph({ assetKey }: { assetKey: string }) {
  const url = `url(/glyphs/${assetKey}.svg)`;
  return (
    <span
      aria-hidden="true"
      className="block h-12 w-9 bg-current"
      style={{
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
}: SolverProps<typeof schema>) {
  const { letterOf, assetKeyOf, ciphertext } = useMemo(
    () => glyphCipher(payload),
    [payload],
  );
  const locked = useMemo<Guesses>(
    () =>
      Object.fromEntries(
        payload.given.map(({ assetKey, letter }) => [letterOf(assetKey), letter]),
      ),
    [payload.given, letterOf],
  );
  const [guessed, setGuessed] = useState<Guesses>(() =>
    Object.fromEntries(
      (initialState?.guesses ?? [])
        .filter(({ assetKey }) => payload.words.flat().includes(assetKey))
        .map(({ assetKey, letter }) => [letterOf(assetKey), letter] as const)
        .filter(([cipherLetter]) => !(cipherLetter in locked)),
    ),
  );
  const guesses = useMemo(() => ({ ...guessed, ...locked }), [guessed, locked]);

  useEffect(() => {
    registerCheck(() =>
      isComplete(ciphertext, guesses)
        ? { answer: decodeLetters(ciphertext, guesses) }
        : null,
    );
  }, [registerCheck, ciphertext, guesses]);

  const update = useCallback(
    (next: Guesses) => {
      setGuessed(next);
      onStateChange({
        guesses: Object.entries(next).map(([cipherLetter, letter]) => ({
          assetKey: assetKeyOf(cipherLetter),
          letter,
        })),
      });
    },
    [assetKeyOf, onStateChange],
  );

  const symbols = useMemo(
    () => ({
      render: (cipherLetter: string) => (
        <Glyph assetKey={assetKeyOf(cipherLetter)} />
      ),
      name: (cipherLetter: string) => symbolName(assetKeyOf(cipherLetter)),
    }),
    [assetKeyOf],
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">
        Every stick figure stands for one letter, always the same one. A few are
        already filled in. Work out the rest from the words they make.
      </p>
      <CipherKeyPanel
        ciphertext={ciphertext}
        guesses={guesses}
        locked={locked}
        symbols={symbols}
        onGuess={(cipherLetter, plainLetter) => {
          const next = { ...guessed };
          if (plainLetter) next[cipherLetter] = plainLetter;
          else delete next[cipherLetter];
          update(next);
        }}
        onClear={() => update({})}
      />
    </div>
  );
}
