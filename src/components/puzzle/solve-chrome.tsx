"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { Credit, SolvedStamp, Walker } from "@/components/brand";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  checkAnswer,
  clearState,
  revealCell,
  saveState,
} from "@/lib/actions/puzzles";
import type { SolverComponent, SolverProps } from "@/puzzles/solver-types";
import { formatDuration } from "@/utils/format-duration";
import {
  clearProgress,
  completeProgress,
  readProgress,
  writeProgress,
} from "@/utils/local-progress";
import { usePuzzleTimer } from "./use-puzzle-timer";

const SAVE_DEBOUNCE_MS = 800;

const subscribeNever = () => () => {};

type ReadAnswer = Parameters<SolverProps["registerCheck"]>[0];

type Notice =
  | "wrong"
  | "incomplete"
  | "cell-sign-in"
  | "reveal-unavailable"
  | "error"
  | "not-saved";

const noticeText: Record<Exclude<Notice, "cell-sign-in">, string> = {
  wrong: "Not quite. Keep going.",
  incomplete: "Finish the puzzle before checking it.",
  "reveal-unavailable": "Reveal is not available for this puzzle yet.",
  error: "The check could not be completed. Try again.",
  "not-saved": "Your progress could not be saved.",
};

type SolveChromeProps = {
  puzzleId: string;
  typeKey: string;
  category: string;
  title: string;
  difficulty: number;
  payload: SolverProps["payload"];
  initialState: SolverProps["initialState"];
  Solver: SolverComponent;
  signedIn: boolean;
  signInHref: string;
  nextHref: string | null;
};

export function SolveChrome({
  puzzleId,
  typeKey,
  category,
  title,
  difficulty,
  payload,
  initialState,
  Solver,
  signedIn,
  signInHref,
  nextHref,
}: SolveChromeProps) {
  const [solvedMs, setSolvedMs] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [attempt, setAttempt] = useState(0);
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const localState = useMemo(
    () => (hydrated ? (readProgress(puzzleId)?.state ?? null) : undefined),
    [hydrated, puzzleId],
  );
  const [pending, startTransition] = useTransition();
  const timer = usePuzzleTimer(solvedMs === null);
  const readAnswer = useRef<ReadAnswer | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const solved = solvedMs !== null;

  const registerCheck = useCallback<SolverProps["registerCheck"]>((read) => {
    readAnswer.current = read;
  }, []);

  useEffect(() => () => clearTimeout(saveTimeout.current), []);

  const onStateChange = useCallback<SolverProps["onStateChange"]>(
    (state) => {
      if (!signedIn) return writeProgress(puzzleId, typeKey, state);
      clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          const result = await saveState(puzzleId, state);
          if (!result.ok) setNotice("not-saved");
        } catch {
          setNotice("not-saved");
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [puzzleId, typeKey, signedIn],
  );

  function check() {
    if (pending || solved) return;
    const answer = readAnswer.current?.();
    if (answer === null || answer === undefined) return setNotice("incomplete");
    const durationMs = timer.read();
    startTransition(async () => {
      try {
        const response = await checkAnswer(puzzleId, answer, {
          mode: "full",
          durationMs,
        });
        if (!response.ok) return setNotice("error");
        if (response.result.correct) {
          if (!signedIn) completeProgress(puzzleId, durationMs);
          setNotice(null);
          setSolvedMs(durationMs);
        } else {
          setNotice("wrong");
        }
      } catch {
        setNotice("error");
      }
    });
  }

  const checkCell = useCallback<NonNullable<SolverProps["checkCell"]>>(
    async (row, col, value) => {
      if (!signedIn) {
        setNotice("cell-sign-in");
        return null;
      }
      const response = await checkAnswer(puzzleId, null, {
        mode: "cell",
        row,
        col,
        value,
      }).catch(() => null);
      if (response?.ok) return response.result.correct;
      setNotice("error");
      return null;
    },
    [puzzleId, signedIn],
  );

  const revealCellValue = useCallback<NonNullable<SolverProps["revealCell"]>>(
    async (row, col) => {
      if (!signedIn) {
        setNotice("cell-sign-in");
        return null;
      }
      const response = await revealCell(puzzleId, row, col).catch(() => null);
      if (response?.ok) return response.value;
      setNotice("error");
      return null;
    },
    [puzzleId, signedIn],
  );

  function reset() {
    clearTimeout(saveTimeout.current);
    readAnswer.current = null;
    setNotice(null);
    setSolvedMs(null);
    setAttempt((value) => value + 1);
    timer.reset();
    if (!signedIn) return clearProgress(puzzleId);
    startTransition(async () => {
      try {
        const result = await clearState(puzzleId);
        if (!result.ok) setNotice("not-saved");
      } catch {
        setNotice("not-saved");
      }
    });
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Credit
          level={1}
          top={category}
          bottom={title}
          className="[&>span:last-child]:text-4xl [&>span:last-child]:break-words sm:[&>span:last-child]:text-5xl"
        />
        <div className="flex items-center gap-4">
          <Badge variant="difficulty" level={difficulty} />
          <p className="font-mono text-lg tabular-nums">
            <span className="sr-only">Elapsed time </span>
            {formatDuration(solved ? solvedMs : timer.displayMs)}
          </p>
        </div>
      </header>

      <div
        key={attempt}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.defaultPrevented &&
            event.target instanceof Element &&
            !event.target.closest("button, a, input, textarea, select")
          ) {
            check();
          }
        }}
      >
        {signedIn || localState !== undefined ? (
          <Solver
            payload={payload}
            initialState={
              attempt === 0 ? (signedIn ? initialState : localState) : null
            }
            onStateChange={onStateChange}
            registerCheck={registerCheck}
            checkCell={solved ? undefined : checkCell}
            revealCell={solved ? undefined : revealCellValue}
          />
        ) : (
          <Walker />
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={check} disabled={pending || solved}>
          Check
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" disabled={solved}>
              Reveal
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reveal the answer?</AlertDialogTitle>
              <AlertDialogDescription>
                Revealing counts as giving up on this puzzle.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => setNotice("reveal-unavailable")}>
                Reveal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="secondary" onClick={reset} disabled={pending}>
          Reset
        </Button>
      </div>

      <div role="status" aria-live="polite" className="min-h-6">
        {notice === "cell-sign-in" ? (
          <p>
            <Link href={signInHref} className="underline underline-offset-4">
              Sign in
            </Link>{" "}
            to check or reveal individual cells.
          </p>
        ) : (
          notice && <p>{noticeText[notice]}</p>
        )}
      </div>

      {solved && (
        <footer className="flex flex-wrap items-center gap-6">
          <SolvedStamp />
          <p>
            Solved in{" "}
            <span className="font-mono tabular-nums">
              {formatDuration(solvedMs)}
            </span>
          </p>
          {nextHref && (
            <Button asChild variant="secondary">
              <Link href={nextHref}>Next in volume</Link>
            </Button>
          )}
        </footer>
      )}
    </section>
  );
}
