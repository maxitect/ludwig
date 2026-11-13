// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { virtual } from "@guidepup/virtual-screen-reader";
import { afterEach, describe, expect, it, vi } from "vitest";
import { content as lastMoveFile } from "./fixtures/dev-pawn-push";
import { contentSchema, payloadSchema } from "./schema";
import { Solver } from "./solver";

const payload = payloadSchema.parse({
  ...contentSchema.parse(lastMoveFile),
  enPassantFile: null,
  plyCount: 1,
  goalText: null,
});

const cursorOn = (square: string) =>
  `application, Chess board, Drag a piece backwards, tap a piece and then a square, or use the arrow keys to move between squares and Enter to pick up and drop a piece., active descendant ${square}`;

afterEach(async () => {
  await virtual.stop();
  cleanup();
});

describe("reverse chess board with a screen reader", () => {
  it("reads the cursor square and its piece, and a pick-up and drop", async () => {
    render(
      <Solver
        payload={payload}
        initialState={null}
        onStateChange={vi.fn()}
        registerCheck={vi.fn()}
        requestCheck={vi.fn()}
        requestReset={vi.fn()}
      />,
    );
    const board = await screen.findByRole("application", {
      name: "Chess board",
    });
    await virtual.start({ container: document.body });
    board.focus();
    await virtual.clearSpokenPhraseLog();

    for (const key of [
      "ArrowLeft",
      "ArrowLeft",
      "ArrowLeft",
      "ArrowLeft",
      "ArrowUp",
      "ArrowUp",
      "Enter",
      "ArrowDown",
      "Enter",
    ]) {
      await virtual.press(key);
    }

    expect(await virtual.spokenPhraseLog()).toEqual([
      "polite: e4",
      "polite: d4",
      cursorOn("d4, empty"),
      "polite: c4",
      cursorOn("c4, empty"),
      "polite: b4",
      cursorOn("b4, white bishop"),
      "polite: a4",
      cursorOn("a4, empty"),
      "polite: a5",
      cursorOn("a5, empty"),
      "polite: a6",
      cursorOn("a6, white pawn"),
      "polite: a6. Picked up a6. Enter to drop, Escape to cancel.",
      "polite: a5. Picked up a6. Enter to drop, Escape to cancel.",
      cursorOn("a5, empty"),
      "polite: a5",
    ]);
    expect(screen.getByRole("button", { name: "Undo" })).toHaveProperty(
      "disabled",
      false,
    );
  });
});
