"use client";

import { ChevronLeftIcon, EllipsisVerticalIcon } from "lucide-react";
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
import { BulletHole, Credit, SolvedStamp, Walker } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  checkAnswer,
  clearState,
  revealCell,
  saveState,
} from "@/lib/actions/puzzles";
import type { RungProblem } from "@/puzzles/word-ladder/schema";
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
  | "error"
  | "not-saved";

const noticeText: Record<Exclude<Notice, "cell-sign-in">, string> = {
  wrong: "Not quite. Keep going.",
  incomplete: "Finish the puzzle before checking it.",
  error: "The check could not be completed. Try again.",
  "not-saved": "Your progress could not be saved.",
};

type SolveChromeProps = {
  puzzleId: string;
  typeKey: string;
  typeName: string;
  category: string;
  title: string;
  difficulty: number;
  payload: SolverProps["payload"];
  initialState: SolverProps["initialState"];
  Solver: SolverComponent;
  signedIn: boolean;
  chessNotation?: SolverProps["chessNotation"];
  signInHref: string;
  nextHref: string | null;
};

export function SolveChrome({
  puzzleId,
  typeKey,
  typeName,
  category,
  title,
  difficulty,
  payload,
  initialState,
  Solver,
  signedIn,
  chessNotation,
  signInHref,
  nextHref,
}: SolveChromeProps) {
  const [solvedMs, setSolvedMs] = useState<number | null>(null);
  const [epilogue, setEpilogue] = useState<string | null>(null);
  const [rungProblems, setRungProblems] = useState<RungProblem[]>();
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
  const resumeLocal = initialState === null && localState != null;
  const [pending, startTransition] = useTransition();
  const timer = usePuzzleTimer(solvedMs === null);
  const readAnswer = useRef<ReadAnswer | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingState = useRef<
    Parameters<SolverProps["onStateChange"]>[0] | null
  >(null);
  const latestCheck = useRef<() => void>(undefined);
  const solved = solvedMs !== null;

  const registerCheck = useCallback<SolverProps["registerCheck"]>((read) => {
    readAnswer.current = read;
  }, []);

  const flushSave = useCallback(async () => {
    clearTimeout(saveTimeout.current);
    const state = pendingState.current;
    if (state === null) return;
    pendingState.current = null;
    try {
      const result = await saveState(puzzleId, state);
      if (!result.ok) setNotice("not-saved");
    } catch {
      setNotice("not-saved");
    }
  }, [puzzleId]);

  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushSave();
    };
    window.addEventListener("pagehide", flushSave);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushSave);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      flushSave();
    };
  }, [flushSave]);

  useEffect(() => {
    latestCheck.current = check;
  });

  const requestCheck = useCallback(() => latestCheck.current?.(), []);

  const onStateChange = useCallback<SolverProps["onStateChange"]>(
    (state) => {
      if (!signedIn) return writeProgress(puzzleId, typeKey, state);
      clearTimeout(saveTimeout.current);
      pendingState.current = state;
      saveTimeout.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
    },
    [puzzleId, typeKey, signedIn, flushSave],
  );

  function check() {
    if (pending || solved) return;
    const answer = readAnswer.current?.();
    if (answer === null || answer === undefined) return setNotice("incomplete");
    const durationMs = timer.read();
    startTransition(async () => {
      await flushSave();
      try {
        const response = await checkAnswer(puzzleId, answer, {
          mode: "full",
          durationMs,
        });
        if (!response.ok) return setNotice("error");
        if (response.result.correct) {
          if (!signedIn) completeProgress(puzzleId, durationMs);
          setNotice(null);
          setEpilogue(response.result.epilogue ?? null);
          setSolvedMs(durationMs);
        } else {
          setRungProblems(response.result.rungProblems);
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
    pendingState.current = null;
    readAnswer.current = null;
    setNotice(null);
    setSolvedMs(null);
    setEpilogue(null);
    setRungProblems(undefined);
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
    <section
      data-solve-mode
      className="flex flex-col gap-6 touch:h-full touch:min-h-0 touch:gap-0"
    >
      <header className="flex flex-col gap-3 touch:-order-2 touch:flex-row touch:items-center touch:border-b-2 touch:border-border touch:pt-[max(0.5rem,env(safe-area-inset-top))] touch:pr-[max(0.5rem,env(safe-area-inset-right))] touch:pb-2 touch:pl-[max(0.5rem,env(safe-area-inset-left))]">
        <Link
          href={`/puzzles/${typeKey}`}
          aria-label={`Back to ${typeName}`}
          className="hidden size-10 shrink-0 items-center justify-center focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring touch:flex"
        >
          <ChevronLeftIcon aria-hidden="true" />
        </Link>
        <Credit
          level={1}
          top={category}
          bottom={title}
          className="[&>span:last-child]:text-4xl [&>span:last-child]:break-words sm:[&>span:last-child]:text-5xl touch:min-w-0 touch:flex-1 touch:[&>span:first-child]:hidden touch:[&>span:last-child]:truncate touch:[&>span:last-child]:text-lg"
        />
        <div className="flex items-center gap-4 touch:shrink-0">
          <Badge variant="difficulty" level={difficulty} className="touch:hidden" />
          <p className="font-mono text-lg tabular-nums">
            <span className="sr-only">Elapsed time </span>
            {formatDuration(solved ? solvedMs : timer.displayMs)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Puzzle menu"
              className="hidden touch:inline-flex"
            >
              <EllipsisVerticalIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={pending || solved} onSelect={check}>
              Check
            </DropdownMenuItem>
            <DropdownMenuItem disabled={pending} onSelect={reset}>
              Reset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div
        key={attempt}
        className="touch:min-h-0 touch:flex-1 touch:overflow-y-auto touch:px-4 touch:[--solver-height:100cqh] touch:[container-type:size]"
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
            key={resumeLocal ? "local" : "initial"}
            payload={payload}
            initialState={
              attempt === 0 ? (resumeLocal ? localState : initialState) : null
            }
            onStateChange={onStateChange}
            registerCheck={registerCheck}
            requestCheck={requestCheck}
            solved={solved}
            chessNotation={chessNotation}
            rungProblems={rungProblems}
            checkCell={solved ? undefined : checkCell}
            revealCell={solved ? undefined : revealCellValue}
          />
        ) : (
          <Walker />
        )}
      </div>

      <div className="flex flex-wrap gap-3 touch:hidden">
        <Button onClick={check} disabled={pending || solved}>
          Check
        </Button>
        <Button variant="secondary" onClick={reset} disabled={pending}>
          Reset
        </Button>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="min-h-6 touch:-order-1 touch:shrink-0 touch:truncate touch:px-4 touch:py-1"
      >
        {notice === "cell-sign-in" ? (
          <p className="touch:truncate">
            <Link href={signInHref} className="underline underline-offset-4">
              Sign in
            </Link>{" "}
            to check or reveal individual cells.
          </p>
        ) : (
          notice && <p className="touch:truncate">{noticeText[notice]}</p>
        )}
      </div>

      {solved && (
        <footer className="flex flex-wrap items-center gap-x-12 gap-y-14 p-4 touch:max-h-[35dvh] touch:gap-x-4 touch:shrink-0 touch:gap-y-6 touch:overflow-y-auto">
          <div className="relative isolate grid size-(--hole-size) shrink-0 place-items-center [--hole-size:264px] touch:[--hole-size:216px]">
            <BulletHole data-testid="solved-hole" />
            <SolvedStamp delay={0.3} data-testid="solved-stamp" />
          </div>
          <p>
            Solved in{" "}
            <span className="font-mono tabular-nums">
              {formatDuration(solvedMs)}
            </span>
          </p>
          {epilogue && <p data-testid="epilogue">{epilogue}</p>}
          {nextHref && (
            <Button asChild variant="secondary">
              <Link href={nextHref}>Next in volume</Link>
            </Button>
          )}
        </footer>
      )}

      <div
        data-testid="solve-slot"
        className="hidden shrink-0 touch:block touch:pr-[max(0.5rem,env(safe-area-inset-right))] touch:pb-[max(0.5rem,env(safe-area-inset-bottom))] touch:pl-[max(0.5rem,env(safe-area-inset-left))]"
      />
    </section>
  );
}
