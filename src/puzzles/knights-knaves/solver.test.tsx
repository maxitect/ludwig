// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload: Payload = {
  questionText: "Who is who?",
  characters: [
    { position: 0, name: "Ann", statements: ["We are both knaves."] },
    { position: 1, name: "Bob", statements: ["Ann is a knave."] },
  ],
};

function renderSolver(initialState: AttemptState | null = null) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  render(
    <Solver
      payload={payload}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
    />,
  );
  const read = () =>
    registerCheck.mock.calls.at(-1)?.[0] as () => {
      roles: AttemptState["roles"];
    } | null;
  return { onStateChange, read };
}

describe("knights and knaves solver", () => {
  it("shows each name and statement with a knight and knave choice", () => {
    renderSolver();
    expect(screen.getByText(/We are both knaves/)).toBeTruthy();
    expect(screen.getByRole("group", { name: /Ann/ })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("registers an answer only once every character has a role", async () => {
    const user = userEvent.setup();
    const { onStateChange, read } = renderSolver();
    expect(read()()).toBeNull();
    await user.click(
      screen.getAllByRole("radio", { name: /Knave/ })[0],
    );
    expect(onStateChange).toHaveBeenLastCalledWith({
      roles: [{ position: 0, role: "knave" }],
    });
    expect(read()()).toBeNull();
    await user.click(screen.getAllByRole("radio", { name: /Knight/ })[1]);
    expect(read()()).toEqual({
      roles: [
        { position: 0, role: "knave" },
        { position: 1, role: "knight" },
      ],
    });
  });

  it("restores saved roles and toggles them from the keyboard", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver({
      roles: [{ position: 0, role: "knight" }],
    });
    const [knight] = screen.getAllByRole("radio", { name: /Knight/ });
    expect((knight as HTMLInputElement).checked).toBe(true);
    await user.click(knight);
    await user.keyboard("{ArrowDown}");
    expect(onStateChange).toHaveBeenLastCalledWith({
      roles: [{ position: 0, role: "knave" }],
    });
  });
});
