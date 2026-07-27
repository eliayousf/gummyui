import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GummyBadge } from "../app/components/ui/GummyBadge";

afterEach(cleanup);

describe("GummyBadge", () => {
  it("renders non-interactive semantic markup by default", () => {
    render(<GummyBadge>Needs review</GummyBadge>);

    const badge = screen.getByText("Needs review").closest(".gummy-badge");
    expect(badge?.tagName).toBe("SPAN");
    expect(badge).not.toHaveAttribute("role", "button");
    expect(badge).not.toHaveAttribute("tabindex");
  });

  it("forwards refs and exposes semantic variant and finish hooks", () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(
      <GummyBadge ref={ref} variant="warning" finish="translucent" data-testid="badge">
        Awaiting approval
      </GummyBadge>,
    );

    expect(ref.current).toBe(screen.getByTestId("badge"));
    expect(ref.current).toHaveAttribute("data-variant", "warning");
    expect(ref.current).toHaveAttribute("data-finish", "translucent");
    expect(ref.current).toHaveAttribute("data-motion", "alive");
  });

  it("keeps optional dots and icons decorative while retaining visible text", () => {
    render(<GummyBadge dot icon="!">Warning</GummyBadge>);

    const badge = screen.getByText("Warning").closest(".gummy-badge");
    expect(badge).toHaveTextContent("Warning");
    expect(badge?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it("offers an explicit static mode for dense or reduced-motion contexts", () => {
    render(<GummyBadge motion="none">Static status</GummyBadge>);

    expect(screen.getByText("Static status").closest(".gummy-badge")).toHaveAttribute(
      "data-motion",
      "none",
    );
  });

  it("offers a one-shot settle when ambient motion is not wanted", () => {
    render(<GummyBadge motion="settle">Settling status</GummyBadge>);

    expect(screen.getByText("Settling status").closest(".gummy-badge")).toHaveAttribute(
      "data-motion",
      "settle",
    );
  });
});
