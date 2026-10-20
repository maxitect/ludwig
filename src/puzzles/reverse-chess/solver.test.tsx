// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { content as lastMoveFile } from "./fixtures/dev-pawn-push";
import { content as unwindFile } from "./fixtures/dev-unwind";
import { contentSchema, type Payload, payloadSchema } from "./schema";
import { Solver } from "./solver";

const lastMove = contentSchema.parse(lastMoveFile);
const unwind = contentSchema.parse(unwindFile);

afterEach(cleanup);

const payloads: Record<string, Payload> = {
  last_move: payloadSchema.parse({
    ...lastMove,
    enPassantFile: null,
    plyCount: 1,
    goalText: null,
  }),
  unwind: payloadSchema.parse({
    ...unwind,
    enPassantFile: null,
    plyCount: 2,
    goalText: unwind.goal?.displayText,
  }),
};

describe.each(Object.entries(payloads))("%s inline controls", (_, payload) => {
  it("disables Check and Reset once solved", () => {
    render(
      <Solver
        payload={payload}
        initialState={null}
        onStateChange={vi.fn()}
        registerCheck={vi.fn()}
        requestCheck={vi.fn()}
        requestReset={vi.fn()}
        solved
      />,
    );
    for (const name of ["Check", "Reset"]) {
      expect(screen.getByRole("button", { name })).toHaveProperty(
        "disabled",
        true,
      );
    }
  });
});
