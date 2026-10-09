// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload: Payload = {
  questionText: "What is x?",
  lines: ["x + 1 = 5", "x is whole"],
};

function renderSolver(initialState: AttemptState | null = null, solved = false) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  const requestCheck = vi.fn();
  render(
    <Solver
      payload={payload}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
      requestCheck={requestCheck}
      solved={solved}
    />,
  );
  const read = () =>
    registerCheck.mock.calls.at(-1)?.[0] as () => { answer: string } | null;
  return { onStateChange, read, requestCheck };
}

describe("napkin maths solver", () => {
  it("shows the lines and a decimal text field", () => {
    renderSolver();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    const input = screen.getByRole("textbox", { name: "Your answer" });
    expect(input.getAttribute("inputmode")).toBe("decimal");
  });

  it("has no answer until a valid decimal is typed, then reports and saves it", async () => {
    const { onStateChange, read } = renderSolver();
    const input = screen.getByRole("textbox", { name: "Your answer" });
    expect(read()()).toBeNull();
    await userEvent.type(input, "four");
    expect(read()()).toBeNull();
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: null });
    await userEvent.clear(input);
    await userEvent.type(input, "4.5");
    expect(read()()).toEqual({ answer: "4.5" });
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: "4.5" });
  });

  it("asks for a check when Enter is pressed in the field", async () => {
    const { requestCheck } = renderSolver();
    await userEvent.type(
      screen.getByRole("textbox", { name: "Your answer" }),
      "4{Enter}",
    );
    expect(requestCheck).toHaveBeenCalledOnce();
  });

  it("restores the saved answer without trailing zeros", () => {
    const { read } = renderSolver({ answer: "4.500000" });
    expect(
      (screen.getByRole("textbox", { name: "Your answer" }) as HTMLInputElement).value,
    ).toBe("4.5");
    expect(read()()).toEqual({ answer: "4.5" });
  });

  it("disables the field once solved", () => {
    renderSolver({ answer: "4" }, true);
    expect(
      (screen.getByRole("textbox", { name: "Your answer" }) as HTMLInputElement).disabled,
    ).toBe(true);
  });
});
