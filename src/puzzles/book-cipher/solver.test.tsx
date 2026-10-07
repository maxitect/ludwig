// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload: Payload = {
  title: "A Test Book",
  author: "An Author",
  lines: [
    { page: 1, line: 1, content: "the lantern burns low" },
    { page: 1, line: 2, content: "until dawn comes round" },
    { page: 2, line: 1, content: "again" },
  ],
  refs: [
    { position: 0, page: 1, line: 2, wordIndex: 2 },
    { position: 1, page: 2, line: 1, wordIndex: 1 },
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
  return { onStateChange, registerCheck };
}

const reader = () => screen.getByRole("region", { name: /^A Test Book, page/ });
const words = () => screen.getAllByRole("textbox", { name: /^Word \d+:/ });
const lastReader = (registerCheck: ReturnType<typeof vi.fn>) =>
  registerCheck.mock.calls.at(-1)?.[0] as () => { answer: string } | null;

describe("book cipher solver", () => {
  it("saves words in reference order with _ for a blank, and checks only a full answer", () => {
    const { onStateChange, registerCheck } = renderSolver();
    fireEvent.change(words()[1], { target: { value: "Again!" } });
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: "_ again" });
    expect(lastReader(registerCheck)()).toBeNull();
    fireEvent.change(words()[0], { target: { value: "dawn" } });
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: "dawn again" });
    expect(lastReader(registerCheck)()).toEqual({ answer: "dawn again" });
    fireEvent.change(words()[0], { target: { value: "" } });
    fireEvent.change(words()[1], { target: { value: "" } });
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: null });
  });

  it("restores saved words", () => {
    renderSolver({ answer: "_ again" });
    expect(words().map((input) => (input as HTMLInputElement).value)).toEqual([
      "",
      "again",
    ]);
  });

  it("turns pages from the keyboard, clamped to the book", async () => {
    const user = userEvent.setup();
    renderSolver();
    reader().focus();
    expect(reader().textContent).toContain("Page 1 of 2");
    await user.keyboard("{ArrowRight}");
    expect(reader().textContent).toContain("Page 2 of 2");
    await user.keyboard("{ArrowRight}");
    expect(reader().textContent).toContain("Page 2 of 2");
    await user.keyboard("{Home}");
    expect(reader().textContent).toContain("Page 1 of 2");
  });

  it("opens and announces the selected reference's location", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.click(words()[1]);
    expect(reader().textContent).toContain("Page 2 of 2");
    expect(reader().querySelector("mark")?.textContent).toBe(
      "Page 2, line 1, word 1: again",
    );
    expect(screen.getByText("Reference 2: page 2, line 1, word 1")).toBeTruthy();
  });
});
