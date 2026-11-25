// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PanelSection } from "./panel-section";

afterEach(cleanup);

const summaryOf = (name: string) => screen.getByText(name).closest("summary")!;
const detailsOf = (name: string) => summaryOf(name).parentElement as HTMLDetailsElement;

describe("PanelSection", () => {
  it("is a native details element whose summary carries the title", () => {
    render(
      <PanelSection title="Clues" defaultOpen>
        <p>Content</p>
      </PanelSection>,
    );
    expect(detailsOf("Clues").tagName).toBe("DETAILS");
    expect(detailsOf("Clues").open).toBe(true);
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("is closed unless it starts open, and the caret keeps the exclusive group's name", () => {
    render(
      <>
        <PanelSection title="One" name="group" defaultOpen>
          <p>1</p>
        </PanelSection>
        <PanelSection title="Two" name="group">
          <p>2</p>
        </PanelSection>
      </>,
    );
    expect(detailsOf("One").open).toBe(true);
    expect(detailsOf("Two").open).toBe(false);
    expect(detailsOf("One").getAttribute("name")).toBe("group");
    expect(detailsOf("Two").getAttribute("name")).toBe("group");
  });

  it("follows a controlled open prop", () => {
    const { rerender } = render(
      <PanelSection title="Across" open>
        <p>list</p>
      </PanelSection>,
    );
    expect(detailsOf("Across").open).toBe(true);
    rerender(
      <PanelSection title="Across" open={false}>
        <p>list</p>
      </PanelSection>,
    );
    expect(detailsOf("Across").open).toBe(false);
  });

  it("reports a toggle through onOpenChange", () => {
    const onOpenChange = vi.fn();
    render(
      <PanelSection title="Notes" onOpenChange={onOpenChange}>
        <p>notes</p>
      </PanelSection>,
    );
    act(() => {
      detailsOf("Notes").open = true;
      fireEvent(detailsOf("Notes"), new Event("toggle"));
    });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("opens and closes by its summary, the native disclosure button", () => {
    render(
      <PanelSection title="Notes">
        <p>notes</p>
      </PanelSection>,
    );
    expect(summaryOf("Notes").tagName).toBe("SUMMARY");
    fireEvent.click(summaryOf("Notes"));
    expect(detailsOf("Notes").open).toBe(true);
    fireEvent.click(summaryOf("Notes"));
    expect(detailsOf("Notes").open).toBe(false);
  });

  it("keeps an open section open when its own caret is pressed with keepOpen", () => {
    render(
      <PanelSection title="Down" defaultOpen keepOpen>
        <p>list</p>
      </PanelSection>,
    );
    const notPrevented = fireEvent.click(summaryOf("Down"));
    expect(notPrevented).toBe(false);
  });
});
