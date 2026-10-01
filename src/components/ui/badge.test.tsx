// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Badge } from "./badge";

afterEach(cleanup);

describe("Badge difficulty variant", () => {
  it.each([1, 2, 3, 4, 5])("renders %i filled cells out of 5", (level) => {
    render(<Badge variant="difficulty" level={level} />);
    const badge = screen.getByRole("img", {
      name: `Difficulty ${level} of 5`,
    });
    const cells = badge.querySelectorAll('[data-slot="difficulty-cell"]');
    const filled = badge.querySelectorAll('[data-filled="true"]');
    expect(cells).toHaveLength(5);
    expect(filled).toHaveLength(level);
  });
});
