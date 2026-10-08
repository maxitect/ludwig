// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Solver } from "./solver";

afterEach(cleanup);

const payload = {
  ruleLabel: "Read the first letter of each line",
  lines: ["Add one.", "Bring two."],
};

function renderSolver(initialState: { answer: string | null } | null = null) {
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
    />,
  );
  const read = () =>
    registerCheck.mock.calls.at(-1)?.[0] as () => { answer: string } | null;
  return { onStateChange, requestCheck, read };
}

describe("acrostic solver", () => {
  it("shows the lines, the rule label and one input, focused", () => {
    renderSolver();
    expect(screen.getByText("Add one.")).toBeTruthy();
    expect(screen.getByText(/first letter of each line/)).toBeTruthy();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(document.activeElement).toBe(screen.getByRole("textbox"));
  });

  it("saves what is typed and registers it once it holds a letter", async () => {
    const user = userEvent.setup();
    const { onStateChange, read } = renderSolver();
    expect(read()()).toBeNull();
    await user.keyboard("ab");
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: "ab" });
    expect(read()()).toEqual({ answer: "ab" });
    await user.clear(screen.getByRole("textbox"));
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: null });
  });

  it("restores the saved answer and checks on Enter", async () => {
    const user = userEvent.setup();
    const { requestCheck } = renderSolver({ answer: "abc" });
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("abc");
    await user.keyboard("{Enter}");
    expect(requestCheck).toHaveBeenCalledTimes(1);
  });
});
