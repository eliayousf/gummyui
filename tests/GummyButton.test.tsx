import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GummyButton } from "../app/components/ui/GummyButton";

afterEach(cleanup);

describe("GummyButton", () => {
  it("uses safe defaults and forwards native button attributes", () => {
    render(<GummyButton aria-describedby="button-help">New task</GummyButton>);

    const button = screen.getByRole("button", { name: "New task" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-variant", "primary");
    expect(button).toHaveAttribute("data-size", "medium");
    expect(button).toHaveAttribute("data-finish", "gel");
    expect(button).toHaveAttribute("aria-describedby", "button-help");
    expect(button).not.toBeDisabled();
  });

  it("supports keyboard activation through native button behaviour", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<GummyButton onClick={onClick}>New task</GummyButton>);

    await user.tab();
    expect(screen.getByRole("button", { name: "New task" })).toHaveFocus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("exposes loading semantics and prevents activation while busy", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GummyButton loading loadingText="Saving" onClick={onClick}>
        New task
      </GummyButton>,
    );

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-loading", "true");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("preserves disabled semantics independently of loading", () => {
    render(<GummyButton disabled>Unavailable</GummyButton>);

    const button = screen.getByRole("button", { name: "Unavailable" });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button).not.toHaveAttribute("data-loading");
  });

  it("forwards refs and exposes explicit variant, size, and finish hooks", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <GummyButton
        ref={ref}
        variant="success"
        size="large"
        finish="translucent"
      >
        Confirm
      </GummyButton>,
    );

    expect(ref.current).toBe(screen.getByRole("button", { name: "Confirm" }));
    expect(ref.current).toHaveAttribute("data-variant", "success");
    expect(ref.current).toHaveAttribute("data-size", "large");
    expect(ref.current).toHaveAttribute("data-finish", "translucent");
  });
});
