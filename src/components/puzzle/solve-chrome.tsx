"use client";

import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  type ComponentType,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { BulletHole, Credit } from "@/components/brand";
import { BackLink } from "@/components/shell/back-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import {
  checkAnswer,
  clearState,
  revealCell,
  saveState,
} from "@/lib/actions/puzzles";
import {
  useDeviceKeyboard,
  useKeyboardInset,
} from "@/puzzles/_shared/puzzle-keyboard";
import { SolveSlotProvider } from "@/puzzles/_shared/solve-slot";
import type { WrongPart } from "@/puzzles/registry";
import type { RungProblem } from "@/puzzles/word-ladder/schema";
import { getSolver } from "@/puzzles/solvers";
import type { SolverProps } from "@/puzzles/solver-types";
import { formatDuration } from "@/utils/format-duration";
import {
  clearProgress,
  completeProgress,
  readProgress,
  writeProgress,
} from "@/utils/local-progress";
import { Deferred } from "@/components/after-hydration";
import { PuzzleMenuButton } from "./puzzle-menu-button";
import { usePuzzleTimer } from "./use-puzzle-timer";

const SAVE_DEBOUNCE_MS = 800;

const loadPuzzleMenu = () =>
  import("./puzzle-menu").then((module) => module.PuzzleMenu);

const SolvedStamp = dynamic(() =>
  import("@/components/brand/solved-stamp").then((m) => m.SolvedStamp),
);

type ReadAnswer = Parameters<SolverProps["registerCheck"]>[0];

type Notice = "wrong" | "incomplete" | "cell-sign-in" | "error" | "not-saved";

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
  signedIn: boolean;
  chessNotation?: SolverProps["chessNotation"];
  signInHref: string;
  nextHref: string | null;
};

export function SolveChrome(props: SolveChromeProps) {
  const Solver = getSolver(props.typeKey);
  if (!Solver) {
    return (
      <section className="flex flex-col gap-4">
        <Credit
          level={1}
          top={props.category}
          bottom={props.title}
          className="[&>span:last-child]:text-4xl [&>span:last-child]:break-words sm:[&>span:last-child]:text-5xl"
        />
        <Badge variant="difficulty" level={props.difficulty} />
        <p>The solver for {props.typeName} is not open yet.</p>
      </section>
    );
  }
  return <SolveBoard {...props} Solver={Solver} />;
}

function SolveBoard({
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
}: SolveChromeProps & { Solver: ComponentType<SolverProps> }) {
  const [solvedMs, setSolvedMs] = useState<number | null>(null);
  const [epilogue, setEpilogue] = useState<string | null>(null);
  const [rungProblems, setRungProblems] = useState<RungProblem[]>();
  const [wrongParts, setWrongParts] = useState<WrongPart[]>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const [localState, setLocalState] = useState<unknown>(undefined);
  const localRead = useRef(false);
  useEffect(() => {
    document.body.dataset.solveMode = "";
    return () => {
      delete document.body.dataset.solveMode;
    };
  }, []);
  useEffect(() => {
    let current = true;
    readProgress(puzzleId).then((entry) => {
      if (!current) return;
      localRead.current = true;
      setLocalState(entry?.state ?? null);
    });
    return () => {
      current = false;
    };
  }, [puzzleId]);
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
  const deviceKeyboard = useDeviceKeyboard();
  const keyboardInset = useKeyboardInset(deviceKeyboard);

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
      setWrongParts(undefined);
      if (!signedIn) {
        if (localRead.current) writeProgress(puzzleId, typeKey, state);
        return;
      }
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
          setWrongParts(response.result.wrongParts);
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
    setWrongParts(undefined);
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
    <SolveSlotProvider value={slot}>
      <section
        className="group/solve flex flex-col gap-6 touch:h-full touch:min-h-0 touch:gap-0"
      >
        <header className="flex flex-col gap-3 touch:-order-2 touch:flex-row touch:items-center touch:border-b-2 touch:border-border touch:pt-[max(0.5rem,env(safe-area-inset-top))] touch:pr-[max(1rem,env(safe-area-inset-right))] touch:pb-2 touch:pl-[max(0.5rem,env(safe-area-inset-left))]">
          <div className="touch:hidden">
            <BackLink
              href={`/puzzles/${typeKey}`}
              label={`Back to ${typeName}`}
            />
          </div>
          <Link
            href={`/puzzles/${typeKey}`}
            aria-label={`Back to ${typeName}`}
            className="hidden size-11 shrink-0 items-center justify-center focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring touch:flex"
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
            <Badge
              variant="difficulty"
              level={difficulty}
              className="touch:hidden"
            />
            <p className="inline-block min-w-[5ch] font-mono text-lg tabular-nums">
              {localState === undefined ? null : (
                <>
                  <span className="sr-only">Elapsed time </span>
                  {formatDuration(solved ? solvedMs : timer.displayMs)}
                </>
              )}
            </p>
          </div>
          <Deferred
            load={loadPuzzleMenu}
            props={{ deviceKeyboard }}
            fallback={<PuzzleMenuButton />}
          />
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
          <Solver
            key={resumeLocal ? "local" : "initial"}
            payload={payload}
            initialState={
              attempt === 0 ? (resumeLocal ? localState : initialState) : null
            }
            onStateChange={onStateChange}
            registerCheck={registerCheck}
            requestCheck={requestCheck}
            requestReset={reset}
            solved={solved}
            chessNotation={chessNotation}
            rungProblems={rungProblems}
            wrongParts={wrongParts}
            checkCell={solved ? undefined : checkCell}
            revealCell={solved ? undefined : revealCellValue}
          />
          {typeKey !== "reverse-chess" && (
            <div className="hidden gap-3 py-4 touch:flex touch:group-has-[[data-solve-slot]:not(:empty)]/solve:hidden">
              <Button onClick={check} disabled={pending || solved}>
                Check
              </Button>
              <Button variant="secondary" onClick={reset} disabled={pending}>
                Reset
              </Button>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex flex-wrap gap-3 touch:hidden",
            typeKey !== "reverse-chess" &&
              "touch:group-has-[[data-solve-slot]:not(:empty)]/solve:flex touch:shrink-0 touch:px-4 touch:py-2",
          )}
        >
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
            notice && (
              <p className="touch:truncate">
                {noticeText[notice]}
                {notice === "wrong" && wrongParts?.length
                  ? ` ${wrongParts.length} ${wrongParts.length === 1 ? "part is" : "parts are"} marked wrong.`
                  : ""}
              </p>
            )
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
          ref={setSlot}
          data-testid="solve-slot"
          data-solve-slot
          style={{ marginBottom: keyboardInset }}
          className="hidden shrink-0 touch:block touch:pr-[max(0.5rem,env(safe-area-inset-right))] touch:pb-[max(0.5rem,env(safe-area-inset-bottom))] touch:pl-[max(0.5rem,env(safe-area-inset-left))]"
        />
      </section>
    </SolveSlotProvider>
  );
}
